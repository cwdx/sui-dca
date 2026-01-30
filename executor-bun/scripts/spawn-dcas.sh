#!/bin/bash
# Spawn multiple DCAs using Sui CLI with custom slippage
#
# Usage:
#   ./scripts/spawn-dcas.sh [count] [slippage_bps] [--dry-run]
#   ./scripts/spawn-dcas.sh 5 300           # 5 DCAs with 3% slippage
#   ./scripts/spawn-dcas.sh 10 500          # 10 DCAs with 5% slippage
#   INPUT_MIST=100000000 ./scripts/spawn-dcas.sh 3  # 0.1 SUI per DCA
#
# Environment variables:
#   INPUT_MIST - Input amount in MIST (default: 10000000 = 0.01 SUI)

set -e

# Config
PACKAGE_ID="0x34c33d8a1fe1ad40e0e0c9419444f1124a1e77ec3a830467d49356232c287a2e"
GLOBAL_CONFIG="0xb20ba0b6aca893907cbff7fc0f9ae276ba9347122424b56a2743673e21cd371e"
CLOCK="0x6"
SUI_TYPE="0x2::sui::SUI"
USDC_TYPE="0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC"

# Amounts (MIST)
INPUT_PER_DCA=${INPUT_MIST:-10000000}   # 0.01 SUI default
REWARD_PER_DCA=25000000                  # 0.025 SUI (protocol minimum)
TOTAL_PER_DCA=$((INPUT_PER_DCA + REWARD_PER_DCA))

# Parse args
COUNT=${1:-5}
SLIPPAGE_BPS=${2:-300}  # Default 3% slippage
DRY_RUN=""

for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]] && DRY_RUN="--dry-run"
  [[ "$arg" == "-h" || "$arg" == "--help" ]] && {
    echo "Usage: $0 [count] [slippage_bps] [--dry-run]"
    echo "  count        - Number of DCAs to create (default: 5)"
    echo "  slippage_bps - Slippage tolerance in basis points (default: 300 = 3%)"
    echo "  --dry-run    - Simulate without executing"
    echo ""
    echo "Environment:"
    echo "  INPUT_MIST   - Input per DCA in MIST (default: 10000000 = 0.01 SUI)"
    exit 0
  }
done

[[ "$1" == "--dry-run" ]] && COUNT=5

echo "=== DCA Spawner (Sui CLI) ==="
echo "Count: $COUNT"
echo "Slippage: ${SLIPPAGE_BPS} bps ($(echo "scale=2; $SLIPPAGE_BPS/100" | bc)%)"
echo "Input per DCA: $(echo "scale=4; $INPUT_PER_DCA/1000000000" | bc) SUI"
echo "Reward per DCA: $(echo "scale=4; $REWARD_PER_DCA/1000000000" | bc) SUI"
echo "Total per DCA: $(echo "scale=4; $TOTAL_PER_DCA/1000000000" | bc) SUI"
echo ""

# Get active address
ADDRESS=$(sui client active-address 2>/dev/null)
echo "Wallet: $ADDRESS"

# Check balance
BALANCE=$(sui client gas --json 2>/dev/null | jq '[.[].mistBalance] | add // 0')
echo "Balance: $(echo "scale=4; $BALANCE/1000000000" | bc) SUI"

# Calculate totals
TOTAL_NEEDED=$((TOTAL_PER_DCA * COUNT))
GAS_BUFFER=50000000  # 0.05 SUI for gas (creating + setting slippage)

echo ""
echo "Total needed: $(echo "scale=4; $TOTAL_NEEDED/1000000000" | bc) SUI + gas"

if [[ $BALANCE -lt $((TOTAL_NEEDED + GAS_BUFFER)) ]]; then
  echo "ERROR: Insufficient balance! Need $(echo "scale=4; ($TOTAL_NEEDED + $GAS_BUFFER)/1000000000" | bc) SUI"
  exit 1
fi

# Build split amounts: [reward_total, input1, input2, ..., inputN]
TOTAL_REWARD=$((REWARD_PER_DCA * COUNT))
SPLIT_AMOUNTS="[$TOTAL_REWARD"
for ((i=0; i<COUNT; i++)); do
  SPLIT_AMOUNTS="$SPLIT_AMOUNTS, $INPUT_PER_DCA"
done
SPLIT_AMOUNTS="$SPLIT_AMOUNTS]"

echo ""
echo "Building PTB with $COUNT DCAs..."

# Build the PTB command
PTB_CMD="sui client ptb --gas-budget 30000000"
PTB_CMD="$PTB_CMD --split-coins gas \"$SPLIT_AMOUNTS\""
PTB_CMD="$PTB_CMD --assign coins"

# Add move calls for each DCA
for ((i=0; i<COUNT; i++)); do
  INPUT_IDX=$((i + 1))
  PTB_CMD="$PTB_CMD --move-call ${PACKAGE_ID}::dca::init_account '<${SUI_TYPE}, ${USDC_TYPE}>' @${GLOBAL_CONFIG} @${CLOCK} @${ADDRESS} coins.${INPUT_IDX} 1 1 1 coins.0"
done

PTB_CMD="$PTB_CMD --transfer-objects \"[coins.0]\" @${ADDRESS}"

echo ""
if [[ -n "$DRY_RUN" ]]; then
  echo "=== DRY RUN ==="
  eval "$PTB_CMD --dry-run"
  echo ""
  echo "Done (dry run)!"
  exit 0
fi

echo "=== CREATING DCAs ==="
OUTPUT=$(eval "$PTB_CMD --json" 2>&1)

# Check for success (either by digest presence or confirmedLocalExecution)
if ! echo "$OUTPUT" | jq -e '.digest' >/dev/null 2>&1; then
  echo "Transaction failed!"
  echo "$OUTPUT" | head -50
  exit 1
fi

DIGEST=$(echo "$OUTPUT" | jq -r '.digest')
echo "Transaction: $DIGEST"

# Extract created DCA IDs
DCA_IDS=$(echo "$OUTPUT" | jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("::dca::DCA"))) | .objectId')
DCA_COUNT=$(echo "$DCA_IDS" | wc -l | tr -d ' ')

echo "Created $DCA_COUNT DCAs"
echo ""

# Set slippage on each DCA
if [[ $SLIPPAGE_BPS -ne 100 ]]; then  # 100 bps is default, skip if using default
  echo "=== SETTING SLIPPAGE (${SLIPPAGE_BPS} bps) ==="

  for DCA_ID in $DCA_IDS; do
    echo -n "  $DCA_ID... "

    SLIP_RESULT=$(sui client call \
      --package "$PACKAGE_ID" \
      --module dca \
      --function set_slippage \
      --type-args "$SUI_TYPE" "$USDC_TYPE" \
      --args "$DCA_ID" "$GLOBAL_CONFIG" "$SLIPPAGE_BPS" \
      --gas-budget 10000000 \
      --json 2>&1)

    if echo "$SLIP_RESULT" | jq -e '.effects.status.status == "success"' >/dev/null 2>&1; then
      echo "✓"
    else
      echo "✗ (may need owner permission)"
    fi
  done
fi

echo ""
echo "=== SUMMARY ==="
echo "Created: $DCA_COUNT DCAs"
echo "Slippage: ${SLIPPAGE_BPS} bps"
echo "Input each: $(echo "scale=4; $INPUT_PER_DCA/1000000000" | bc) SUI"
echo ""
echo "DCA IDs:"
echo "$DCA_IDS" | while read -r id; do echo "  $id"; done
echo ""
echo "Done!"
