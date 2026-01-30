/**
 * @title Config Module
 * @notice Global configuration for the DCA protocol with admin-controlled upgradable settings.
 * @dev Existing DCA accounts snapshot config at creation time, so changes only affect new accounts.
 */

import { bcs } from "@mysten/sui/bcs";
import type { SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromBase64, fromHex, toHex } from "@mysten/sui/utils";
import { String } from "../../_dependencies/std/ascii/structs";
import { Option } from "../../_dependencies/std/option/structs";
import { Balance } from "../../_dependencies/sui/balance/structs";
import { ID, UID } from "../../_dependencies/sui/object/structs";
import { SUI } from "../../_dependencies/sui/sui/structs";
import { Table } from "../../_dependencies/sui/table/structs";
import { getTypeOrigin } from "../../_envs";
import {
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  fieldToJSON,
  type PhantomReified,
  phantom,
  type Reified,
  type StructClass,
  type ToField,
  type ToJSON,
  type ToTypeStr as ToPhantom,
  type ToTypeStr,
  vector,
} from "../../_framework/reified";
import {
  composeSuiType,
  compressSuiType,
  type FieldsWithTypes,
  fetchObjectBcs,
  type SupportedSuiClient,
} from "../../_framework/util";
import type { Vector } from "../../_framework/vector";

/* ============================== AdminCap =============================== */

export function isAdminCap(type: string): boolean {
  type = compressSuiType(type);
  return (
    type === `${getTypeOrigin("dca", "config::AdminCap")}::config::AdminCap`
  );
}

export interface AdminCapFields {
  id: ToField<UID>;
}

export type AdminCapReified = Reified<AdminCap, AdminCapFields>;

export type AdminCapJSONField = {
  id: string;
};

export type AdminCapJSON = {
  $typeName: typeof AdminCap.$typeName;
  $typeArgs: [];
} & AdminCapJSONField;

/**
 * Capability for admin operations. Created once at module init.
 * Authorization is via object::id() comparison, not address checks.
 */
export class AdminCap implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::AdminCap` = `${getTypeOrigin(
    "dca",
    "config::AdminCap",
  )}::config::AdminCap` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof AdminCap.$typeName = AdminCap.$typeName;
  readonly $fullTypeName: `${string}::config::AdminCap`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof AdminCap.$isPhantom = AdminCap.$isPhantom;

  readonly id: ToField<UID>;

  private constructor(typeArgs: [], fields: AdminCapFields) {
    this.$fullTypeName = composeSuiType(
      AdminCap.$typeName,
      ...typeArgs,
    ) as `${string}::config::AdminCap`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
  }

  static reified(): AdminCapReified {
    const reifiedBcs = AdminCap.bcs;
    return {
      typeName: AdminCap.$typeName,
      fullTypeName: composeSuiType(
        AdminCap.$typeName,
        ...[],
      ) as `${string}::config::AdminCap`,
      typeArgs: [] as [],
      isPhantom: AdminCap.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => AdminCap.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        AdminCap.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        AdminCap.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => AdminCap.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => AdminCap.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        AdminCap.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        AdminCap.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        AdminCap.fetch(client, id),
      new: (fields: AdminCapFields) => {
        return new AdminCap([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): AdminCapReified {
    return AdminCap.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<AdminCap>> {
    return phantom(AdminCap.reified());
  }

  static get p(): PhantomReified<ToTypeStr<AdminCap>> {
    return AdminCap.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("AdminCap", {
      id: UID.bcs,
    });
  }

  private static cachedBcs: ReturnType<typeof AdminCap.instantiateBcs> | null =
    null;

  static get bcs(): ReturnType<typeof AdminCap.instantiateBcs> {
    if (!AdminCap.cachedBcs) {
      AdminCap.cachedBcs = AdminCap.instantiateBcs();
    }
    return AdminCap.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): AdminCap {
    if (!isAdminCap(item.type)) {
      throw new Error("not a AdminCap type");
    }

    return AdminCap.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
    });
  }

  static fromBcs(data: Uint8Array): AdminCap {
    return AdminCap.fromFields(AdminCap.bcs.parse(data));
  }

  toJSONField(): AdminCapJSONField {
    return {
      id: this.id,
    };
  }

  toJSON(): AdminCapJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
    });
  }

  static fromJSON(json: Record<string, any>): AdminCap {
    if (json.$typeName !== AdminCap.$typeName) {
      throw new Error(
        `not a AdminCap json object: expected '${AdminCap.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return AdminCap.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): AdminCap {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isAdminCap(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a AdminCap object`,
      );
    }
    return AdminCap.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): AdminCap {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isAdminCap(data.bcs.type)) {
        throw new Error(`object at is not a AdminCap object`);
      }

      return AdminCap.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return AdminCap.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<AdminCap> {
    const res = await fetchObjectBcs(client, id);
    if (!isAdminCap(res.type)) {
      throw new Error(`object at id ${id} is not a AdminCap object`);
    }

    return AdminCap.fromBcs(res.bcsBytes);
  }
}

/* ============================== GlobalConfig =============================== */

export function isGlobalConfig(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::GlobalConfig")}::config::GlobalConfig`
  );
}

export interface GlobalConfigFields {
  id: ToField<UID>;
  /** Protocol version for upgrade tracking */
  version: ToField<"u64">;
  /** AdminCap ID for authorization (not address!) */
  admin: ToField<ID>;
  /** Fee in basis points (1 bps = 0.01%). Default: 30 bps = 0.30% */
  feeBps: ToField<"u64">;
  /** Executor reward per trade in MIST (incentive for keepers) */
  executorRewardPerTrade: ToField<"u64">;
  /** Maximum orders per DCA account */
  maxOrdersPerAccount: ToField<"u64">;
  /** Minimum funding per trade in MIST */
  minFundingPerTrade: ToField<"u64">;
  /** Default slippage tolerance in basis points. Default: 100 bps = 1% */
  defaultSlippageBps: ToField<"u64">;
  /** Maximum slippage tolerance users can set. Default: 1000 bps = 10% */
  maxSlippageBps: ToField<"u64">;
  /** Minimum interval between trades in seconds. Default: 900 = 15 minutes */
  minIntervalSeconds: ToField<"u64">;
  /** Treasury address for protocol fee collection */
  treasury: ToField<"address">;
  /** Whether protocol is paused (emergency stop) */
  paused: ToField<"bool">;
  /** Whether executor whitelist is enabled (disabled by default for permissionless execution) */
  executorWhitelistEnabled: ToField<"bool">;
  /** Whitelisted executor addresses (only enforced if executor_whitelist_enabled is true) */
  whitelistedExecutors: ToField<Vector<"address">>;
}

export type GlobalConfigReified = Reified<GlobalConfig, GlobalConfigFields>;

export type GlobalConfigJSONField = {
  id: string;
  version: string;
  admin: string;
  feeBps: string;
  executorRewardPerTrade: string;
  maxOrdersPerAccount: string;
  minFundingPerTrade: string;
  defaultSlippageBps: string;
  maxSlippageBps: string;
  minIntervalSeconds: string;
  treasury: string;
  paused: boolean;
  executorWhitelistEnabled: boolean;
  whitelistedExecutors: string[];
};

export type GlobalConfigJSON = {
  $typeName: typeof GlobalConfig.$typeName;
  $typeArgs: [];
} & GlobalConfigJSONField;

/** Global protocol configuration. Shared object. */
export class GlobalConfig implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::GlobalConfig` =
    `${getTypeOrigin(
      "dca",
      "config::GlobalConfig",
    )}::config::GlobalConfig` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof GlobalConfig.$typeName = GlobalConfig.$typeName;
  readonly $fullTypeName: `${string}::config::GlobalConfig`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof GlobalConfig.$isPhantom = GlobalConfig.$isPhantom;

  readonly id: ToField<UID>;
  /** Protocol version for upgrade tracking */
  readonly version: ToField<"u64">;
  /** AdminCap ID for authorization (not address!) */
  readonly admin: ToField<ID>;
  /** Fee in basis points (1 bps = 0.01%). Default: 30 bps = 0.30% */
  readonly feeBps: ToField<"u64">;
  /** Executor reward per trade in MIST (incentive for keepers) */
  readonly executorRewardPerTrade: ToField<"u64">;
  /** Maximum orders per DCA account */
  readonly maxOrdersPerAccount: ToField<"u64">;
  /** Minimum funding per trade in MIST */
  readonly minFundingPerTrade: ToField<"u64">;
  /** Default slippage tolerance in basis points. Default: 100 bps = 1% */
  readonly defaultSlippageBps: ToField<"u64">;
  /** Maximum slippage tolerance users can set. Default: 1000 bps = 10% */
  readonly maxSlippageBps: ToField<"u64">;
  /** Minimum interval between trades in seconds. Default: 900 = 15 minutes */
  readonly minIntervalSeconds: ToField<"u64">;
  /** Treasury address for protocol fee collection */
  readonly treasury: ToField<"address">;
  /** Whether protocol is paused (emergency stop) */
  readonly paused: ToField<"bool">;
  /** Whether executor whitelist is enabled (disabled by default for permissionless execution) */
  readonly executorWhitelistEnabled: ToField<"bool">;
  /** Whitelisted executor addresses (only enforced if executor_whitelist_enabled is true) */
  readonly whitelistedExecutors: ToField<Vector<"address">>;

  private constructor(typeArgs: [], fields: GlobalConfigFields) {
    this.$fullTypeName = composeSuiType(
      GlobalConfig.$typeName,
      ...typeArgs,
    ) as `${string}::config::GlobalConfig`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.version = fields.version;
    this.admin = fields.admin;
    this.feeBps = fields.feeBps;
    this.executorRewardPerTrade = fields.executorRewardPerTrade;
    this.maxOrdersPerAccount = fields.maxOrdersPerAccount;
    this.minFundingPerTrade = fields.minFundingPerTrade;
    this.defaultSlippageBps = fields.defaultSlippageBps;
    this.maxSlippageBps = fields.maxSlippageBps;
    this.minIntervalSeconds = fields.minIntervalSeconds;
    this.treasury = fields.treasury;
    this.paused = fields.paused;
    this.executorWhitelistEnabled = fields.executorWhitelistEnabled;
    this.whitelistedExecutors = fields.whitelistedExecutors;
  }

  static reified(): GlobalConfigReified {
    const reifiedBcs = GlobalConfig.bcs;
    return {
      typeName: GlobalConfig.$typeName,
      fullTypeName: composeSuiType(
        GlobalConfig.$typeName,
        ...[],
      ) as `${string}::config::GlobalConfig`,
      typeArgs: [] as [],
      isPhantom: GlobalConfig.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        GlobalConfig.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        GlobalConfig.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        GlobalConfig.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => GlobalConfig.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => GlobalConfig.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        GlobalConfig.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        GlobalConfig.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        GlobalConfig.fetch(client, id),
      new: (fields: GlobalConfigFields) => {
        return new GlobalConfig([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): GlobalConfigReified {
    return GlobalConfig.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<GlobalConfig>> {
    return phantom(GlobalConfig.reified());
  }

  static get p(): PhantomReified<ToTypeStr<GlobalConfig>> {
    return GlobalConfig.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("GlobalConfig", {
      id: UID.bcs,
      version: bcs.u64(),
      admin: ID.bcs,
      fee_bps: bcs.u64(),
      executor_reward_per_trade: bcs.u64(),
      max_orders_per_account: bcs.u64(),
      min_funding_per_trade: bcs.u64(),
      default_slippage_bps: bcs.u64(),
      max_slippage_bps: bcs.u64(),
      min_interval_seconds: bcs.u64(),
      treasury: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      paused: bcs.bool(),
      executor_whitelist_enabled: bcs.bool(),
      whitelisted_executors: bcs.vector(
        bcs.bytes(32).transform({
          input: (val: string) => fromHex(val),
          output: (val: Uint8Array) => toHex(val),
        }),
      ),
    });
  }

  private static cachedBcs: ReturnType<
    typeof GlobalConfig.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof GlobalConfig.instantiateBcs> {
    if (!GlobalConfig.cachedBcs) {
      GlobalConfig.cachedBcs = GlobalConfig.instantiateBcs();
    }
    return GlobalConfig.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): GlobalConfig {
    return GlobalConfig.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      version: decodeFromFields("u64", fields.version),
      admin: decodeFromFields(ID.reified(), fields.admin),
      feeBps: decodeFromFields("u64", fields.fee_bps),
      executorRewardPerTrade: decodeFromFields(
        "u64",
        fields.executor_reward_per_trade,
      ),
      maxOrdersPerAccount: decodeFromFields(
        "u64",
        fields.max_orders_per_account,
      ),
      minFundingPerTrade: decodeFromFields("u64", fields.min_funding_per_trade),
      defaultSlippageBps: decodeFromFields("u64", fields.default_slippage_bps),
      maxSlippageBps: decodeFromFields("u64", fields.max_slippage_bps),
      minIntervalSeconds: decodeFromFields("u64", fields.min_interval_seconds),
      treasury: decodeFromFields("address", fields.treasury),
      paused: decodeFromFields("bool", fields.paused),
      executorWhitelistEnabled: decodeFromFields(
        "bool",
        fields.executor_whitelist_enabled,
      ),
      whitelistedExecutors: decodeFromFields(
        vector("address"),
        fields.whitelisted_executors,
      ),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): GlobalConfig {
    if (!isGlobalConfig(item.type)) {
      throw new Error("not a GlobalConfig type");
    }

    return GlobalConfig.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      version: decodeFromFieldsWithTypes("u64", item.fields.version),
      admin: decodeFromFieldsWithTypes(ID.reified(), item.fields.admin),
      feeBps: decodeFromFieldsWithTypes("u64", item.fields.fee_bps),
      executorRewardPerTrade: decodeFromFieldsWithTypes(
        "u64",
        item.fields.executor_reward_per_trade,
      ),
      maxOrdersPerAccount: decodeFromFieldsWithTypes(
        "u64",
        item.fields.max_orders_per_account,
      ),
      minFundingPerTrade: decodeFromFieldsWithTypes(
        "u64",
        item.fields.min_funding_per_trade,
      ),
      defaultSlippageBps: decodeFromFieldsWithTypes(
        "u64",
        item.fields.default_slippage_bps,
      ),
      maxSlippageBps: decodeFromFieldsWithTypes(
        "u64",
        item.fields.max_slippage_bps,
      ),
      minIntervalSeconds: decodeFromFieldsWithTypes(
        "u64",
        item.fields.min_interval_seconds,
      ),
      treasury: decodeFromFieldsWithTypes("address", item.fields.treasury),
      paused: decodeFromFieldsWithTypes("bool", item.fields.paused),
      executorWhitelistEnabled: decodeFromFieldsWithTypes(
        "bool",
        item.fields.executor_whitelist_enabled,
      ),
      whitelistedExecutors: decodeFromFieldsWithTypes(
        vector("address"),
        item.fields.whitelisted_executors,
      ),
    });
  }

  static fromBcs(data: Uint8Array): GlobalConfig {
    return GlobalConfig.fromFields(GlobalConfig.bcs.parse(data));
  }

  toJSONField(): GlobalConfigJSONField {
    return {
      id: this.id,
      version: this.version.toString(),
      admin: this.admin,
      feeBps: this.feeBps.toString(),
      executorRewardPerTrade: this.executorRewardPerTrade.toString(),
      maxOrdersPerAccount: this.maxOrdersPerAccount.toString(),
      minFundingPerTrade: this.minFundingPerTrade.toString(),
      defaultSlippageBps: this.defaultSlippageBps.toString(),
      maxSlippageBps: this.maxSlippageBps.toString(),
      minIntervalSeconds: this.minIntervalSeconds.toString(),
      treasury: this.treasury,
      paused: this.paused,
      executorWhitelistEnabled: this.executorWhitelistEnabled,
      whitelistedExecutors: fieldToJSON<Vector<"address">>(
        `vector<address>`,
        this.whitelistedExecutors,
      ),
    };
  }

  toJSON(): GlobalConfigJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): GlobalConfig {
    return GlobalConfig.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      version: decodeFromJSONField("u64", field.version),
      admin: decodeFromJSONField(ID.reified(), field.admin),
      feeBps: decodeFromJSONField("u64", field.feeBps),
      executorRewardPerTrade: decodeFromJSONField(
        "u64",
        field.executorRewardPerTrade,
      ),
      maxOrdersPerAccount: decodeFromJSONField(
        "u64",
        field.maxOrdersPerAccount,
      ),
      minFundingPerTrade: decodeFromJSONField("u64", field.minFundingPerTrade),
      defaultSlippageBps: decodeFromJSONField("u64", field.defaultSlippageBps),
      maxSlippageBps: decodeFromJSONField("u64", field.maxSlippageBps),
      minIntervalSeconds: decodeFromJSONField("u64", field.minIntervalSeconds),
      treasury: decodeFromJSONField("address", field.treasury),
      paused: decodeFromJSONField("bool", field.paused),
      executorWhitelistEnabled: decodeFromJSONField(
        "bool",
        field.executorWhitelistEnabled,
      ),
      whitelistedExecutors: decodeFromJSONField(
        vector("address"),
        field.whitelistedExecutors,
      ),
    });
  }

  static fromJSON(json: Record<string, any>): GlobalConfig {
    if (json.$typeName !== GlobalConfig.$typeName) {
      throw new Error(
        `not a GlobalConfig json object: expected '${GlobalConfig.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return GlobalConfig.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): GlobalConfig {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isGlobalConfig(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a GlobalConfig object`,
      );
    }
    return GlobalConfig.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): GlobalConfig {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isGlobalConfig(data.bcs.type)
      ) {
        throw new Error(`object at is not a GlobalConfig object`);
      }

      return GlobalConfig.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return GlobalConfig.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<GlobalConfig> {
    const res = await fetchObjectBcs(client, id);
    if (!isGlobalConfig(res.type)) {
      throw new Error(`object at id ${id} is not a GlobalConfig object`);
    }

    return GlobalConfig.fromBcs(res.bcsBytes);
  }
}

/* ============================== FeeTracker =============================== */

export function isFeeTracker(type: string): boolean {
  type = compressSuiType(type);
  return (
    type === `${getTypeOrigin("dca", "config::FeeTracker")}::config::FeeTracker`
  );
}

export interface FeeTrackerFields {
  id: ToField<UID>;
  /** AdminCap ID for authorization */
  admin: ToField<ID>;
  /** Total fees collected in SUI (from executor rewards returned) */
  totalSuiCollected: ToField<"u64">;
  /** Accumulated SUI from unused executor rewards */
  suiBalance: ToField<Balance<ToPhantom<SUI>>>;
}

export type FeeTrackerReified = Reified<FeeTracker, FeeTrackerFields>;

export type FeeTrackerJSONField = {
  id: string;
  admin: string;
  totalSuiCollected: string;
  suiBalance: ToJSON<Balance<ToPhantom<SUI>>>;
};

export type FeeTrackerJSON = {
  $typeName: typeof FeeTracker.$typeName;
  $typeArgs: [];
} & FeeTrackerJSONField;

/**
 * Tracks total fees collected per token type (for analytics only).
 * Actual fees are transferred directly to treasury.
 */
export class FeeTracker implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::FeeTracker` = `${getTypeOrigin(
    "dca",
    "config::FeeTracker",
  )}::config::FeeTracker` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof FeeTracker.$typeName = FeeTracker.$typeName;
  readonly $fullTypeName: `${string}::config::FeeTracker`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof FeeTracker.$isPhantom = FeeTracker.$isPhantom;

  readonly id: ToField<UID>;
  /** AdminCap ID for authorization */
  readonly admin: ToField<ID>;
  /** Total fees collected in SUI (from executor rewards returned) */
  readonly totalSuiCollected: ToField<"u64">;
  /** Accumulated SUI from unused executor rewards */
  readonly suiBalance: ToField<Balance<ToPhantom<SUI>>>;

  private constructor(typeArgs: [], fields: FeeTrackerFields) {
    this.$fullTypeName = composeSuiType(
      FeeTracker.$typeName,
      ...typeArgs,
    ) as `${string}::config::FeeTracker`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.admin = fields.admin;
    this.totalSuiCollected = fields.totalSuiCollected;
    this.suiBalance = fields.suiBalance;
  }

  static reified(): FeeTrackerReified {
    const reifiedBcs = FeeTracker.bcs;
    return {
      typeName: FeeTracker.$typeName,
      fullTypeName: composeSuiType(
        FeeTracker.$typeName,
        ...[],
      ) as `${string}::config::FeeTracker`,
      typeArgs: [] as [],
      isPhantom: FeeTracker.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        FeeTracker.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        FeeTracker.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        FeeTracker.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => FeeTracker.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => FeeTracker.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        FeeTracker.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        FeeTracker.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        FeeTracker.fetch(client, id),
      new: (fields: FeeTrackerFields) => {
        return new FeeTracker([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): FeeTrackerReified {
    return FeeTracker.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<FeeTracker>> {
    return phantom(FeeTracker.reified());
  }

  static get p(): PhantomReified<ToTypeStr<FeeTracker>> {
    return FeeTracker.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("FeeTracker", {
      id: UID.bcs,
      admin: ID.bcs,
      total_sui_collected: bcs.u64(),
      sui_balance: Balance.bcs,
    });
  }

  private static cachedBcs: ReturnType<
    typeof FeeTracker.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof FeeTracker.instantiateBcs> {
    if (!FeeTracker.cachedBcs) {
      FeeTracker.cachedBcs = FeeTracker.instantiateBcs();
    }
    return FeeTracker.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): FeeTracker {
    return FeeTracker.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      admin: decodeFromFields(ID.reified(), fields.admin),
      totalSuiCollected: decodeFromFields("u64", fields.total_sui_collected),
      suiBalance: decodeFromFields(
        Balance.reified(phantom(SUI.reified())),
        fields.sui_balance,
      ),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): FeeTracker {
    if (!isFeeTracker(item.type)) {
      throw new Error("not a FeeTracker type");
    }

    return FeeTracker.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      admin: decodeFromFieldsWithTypes(ID.reified(), item.fields.admin),
      totalSuiCollected: decodeFromFieldsWithTypes(
        "u64",
        item.fields.total_sui_collected,
      ),
      suiBalance: decodeFromFieldsWithTypes(
        Balance.reified(phantom(SUI.reified())),
        item.fields.sui_balance,
      ),
    });
  }

  static fromBcs(data: Uint8Array): FeeTracker {
    return FeeTracker.fromFields(FeeTracker.bcs.parse(data));
  }

  toJSONField(): FeeTrackerJSONField {
    return {
      id: this.id,
      admin: this.admin,
      totalSuiCollected: this.totalSuiCollected.toString(),
      suiBalance: this.suiBalance.toJSONField(),
    };
  }

  toJSON(): FeeTrackerJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): FeeTracker {
    return FeeTracker.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      admin: decodeFromJSONField(ID.reified(), field.admin),
      totalSuiCollected: decodeFromJSONField("u64", field.totalSuiCollected),
      suiBalance: decodeFromJSONField(
        Balance.reified(phantom(SUI.reified())),
        field.suiBalance,
      ),
    });
  }

  static fromJSON(json: Record<string, any>): FeeTracker {
    if (json.$typeName !== FeeTracker.$typeName) {
      throw new Error(
        `not a FeeTracker json object: expected '${FeeTracker.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return FeeTracker.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): FeeTracker {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isFeeTracker(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a FeeTracker object`,
      );
    }
    return FeeTracker.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): FeeTracker {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isFeeTracker(data.bcs.type)) {
        throw new Error(`object at is not a FeeTracker object`);
      }

      return FeeTracker.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return FeeTracker.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<FeeTracker> {
    const res = await fetchObjectBcs(client, id);
    if (!isFeeTracker(res.type)) {
      throw new Error(`object at id ${id} is not a FeeTracker object`);
    }

    return FeeTracker.fromBcs(res.bcsBytes);
  }
}

/* ============================== PriceFeed =============================== */

export function isPriceFeed(type: string): boolean {
  type = compressSuiType(type);
  return (
    type === `${getTypeOrigin("dca", "config::PriceFeed")}::config::PriceFeed`
  );
}

export interface PriceFeedFields {
  /** Pyth price feed ID (32 bytes) */
  feedId: ToField<Vector<"u8">>;
  /** Quote currency: 0=USD (direct), 1=SUI (needs routing) */
  quoteCurrency: ToField<"u8">;
  /** Intermediate feed ID for routing (e.g., SUI/USD feed when token has TOKEN/SUI feed) */
  intermediateFeedId: ToField<Option<Vector<"u8">>>;
}

export type PriceFeedReified = Reified<PriceFeed, PriceFeedFields>;

export type PriceFeedJSONField = {
  feedId: number[];
  quoteCurrency: number;
  intermediateFeedId: number[] | null;
};

export type PriceFeedJSON = {
  $typeName: typeof PriceFeed.$typeName;
  $typeArgs: [];
} & PriceFeedJSONField;

/**
 * Price feed configuration for a token
 * Supports direct USD feeds or routing through intermediate (e.g., TOKEN→SUI→USD)
 */
export class PriceFeed implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::PriceFeed` = `${getTypeOrigin(
    "dca",
    "config::PriceFeed",
  )}::config::PriceFeed` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof PriceFeed.$typeName = PriceFeed.$typeName;
  readonly $fullTypeName: `${string}::config::PriceFeed`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof PriceFeed.$isPhantom = PriceFeed.$isPhantom;

  /** Pyth price feed ID (32 bytes) */
  readonly feedId: ToField<Vector<"u8">>;
  /** Quote currency: 0=USD (direct), 1=SUI (needs routing) */
  readonly quoteCurrency: ToField<"u8">;
  /** Intermediate feed ID for routing (e.g., SUI/USD feed when token has TOKEN/SUI feed) */
  readonly intermediateFeedId: ToField<Option<Vector<"u8">>>;

  private constructor(typeArgs: [], fields: PriceFeedFields) {
    this.$fullTypeName = composeSuiType(
      PriceFeed.$typeName,
      ...typeArgs,
    ) as `${string}::config::PriceFeed`;
    this.$typeArgs = typeArgs;

    this.feedId = fields.feedId;
    this.quoteCurrency = fields.quoteCurrency;
    this.intermediateFeedId = fields.intermediateFeedId;
  }

  static reified(): PriceFeedReified {
    const reifiedBcs = PriceFeed.bcs;
    return {
      typeName: PriceFeed.$typeName,
      fullTypeName: composeSuiType(
        PriceFeed.$typeName,
        ...[],
      ) as `${string}::config::PriceFeed`,
      typeArgs: [] as [],
      isPhantom: PriceFeed.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => PriceFeed.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PriceFeed.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        PriceFeed.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => PriceFeed.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => PriceFeed.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PriceFeed.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PriceFeed.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PriceFeed.fetch(client, id),
      new: (fields: PriceFeedFields) => {
        return new PriceFeed([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): PriceFeedReified {
    return PriceFeed.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<PriceFeed>> {
    return phantom(PriceFeed.reified());
  }

  static get p(): PhantomReified<ToTypeStr<PriceFeed>> {
    return PriceFeed.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("PriceFeed", {
      feed_id: bcs.vector(bcs.u8()),
      quote_currency: bcs.u8(),
      intermediate_feed_id: Option.bcs(bcs.vector(bcs.u8())),
    });
  }

  private static cachedBcs: ReturnType<typeof PriceFeed.instantiateBcs> | null =
    null;

  static get bcs(): ReturnType<typeof PriceFeed.instantiateBcs> {
    if (!PriceFeed.cachedBcs) {
      PriceFeed.cachedBcs = PriceFeed.instantiateBcs();
    }
    return PriceFeed.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): PriceFeed {
    return PriceFeed.reified().new({
      feedId: decodeFromFields(vector("u8"), fields.feed_id),
      quoteCurrency: decodeFromFields("u8", fields.quote_currency),
      intermediateFeedId: decodeFromFields(
        Option.reified(vector("u8")),
        fields.intermediate_feed_id,
      ),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): PriceFeed {
    if (!isPriceFeed(item.type)) {
      throw new Error("not a PriceFeed type");
    }

    return PriceFeed.reified().new({
      feedId: decodeFromFieldsWithTypes(vector("u8"), item.fields.feed_id),
      quoteCurrency: decodeFromFieldsWithTypes(
        "u8",
        item.fields.quote_currency,
      ),
      intermediateFeedId: decodeFromFieldsWithTypes(
        Option.reified(vector("u8")),
        item.fields.intermediate_feed_id,
      ),
    });
  }

  static fromBcs(data: Uint8Array): PriceFeed {
    return PriceFeed.fromFields(PriceFeed.bcs.parse(data));
  }

  toJSONField(): PriceFeedJSONField {
    return {
      feedId: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.feedId),
      quoteCurrency: this.quoteCurrency,
      intermediateFeedId: fieldToJSON<Option<Vector<"u8">>>(
        `${Option.$typeName}<vector<u8>>`,
        this.intermediateFeedId,
      ),
    };
  }

  toJSON(): PriceFeedJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): PriceFeed {
    return PriceFeed.reified().new({
      feedId: decodeFromJSONField(vector("u8"), field.feedId),
      quoteCurrency: decodeFromJSONField("u8", field.quoteCurrency),
      intermediateFeedId: decodeFromJSONField(
        Option.reified(vector("u8")),
        field.intermediateFeedId,
      ),
    });
  }

  static fromJSON(json: Record<string, any>): PriceFeed {
    if (json.$typeName !== PriceFeed.$typeName) {
      throw new Error(
        `not a PriceFeed json object: expected '${PriceFeed.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return PriceFeed.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): PriceFeed {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPriceFeed(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PriceFeed object`,
      );
    }
    return PriceFeed.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): PriceFeed {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isPriceFeed(data.bcs.type)) {
        throw new Error(`object at is not a PriceFeed object`);
      }

      return PriceFeed.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return PriceFeed.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<PriceFeed> {
    const res = await fetchObjectBcs(client, id);
    if (!isPriceFeed(res.type)) {
      throw new Error(`object at id ${id} is not a PriceFeed object`);
    }

    return PriceFeed.fromBcs(res.bcsBytes);
  }
}

/* ============================== PriceFeedRegistry =============================== */

export function isPriceFeedRegistry(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::PriceFeedRegistry")}::config::PriceFeedRegistry`
  );
}

export interface PriceFeedRegistryFields {
  id: ToField<UID>;
  /** AdminCap ID for authorization */
  admin: ToField<ID>;
  /** TypeName string -> PriceFeed config */
  feeds: ToField<Table<ToPhantom<String>, ToPhantom<PriceFeed>>>;
  /** Cached SUI/USD feed ID for routing lookups */
  suiUsdFeedId: ToField<Vector<"u8">>;
}

export type PriceFeedRegistryReified = Reified<
  PriceFeedRegistry,
  PriceFeedRegistryFields
>;

export type PriceFeedRegistryJSONField = {
  id: string;
  admin: string;
  feeds: ToJSON<Table<ToPhantom<String>, ToPhantom<PriceFeed>>>;
  suiUsdFeedId: number[];
};

export type PriceFeedRegistryJSON = {
  $typeName: typeof PriceFeedRegistry.$typeName;
  $typeArgs: [];
} & PriceFeedRegistryJSONField;

/** Registry mapping coin types to their Pyth price feed configurations */
export class PriceFeedRegistry implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::PriceFeedRegistry` =
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRegistry",
    )}::config::PriceFeedRegistry` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof PriceFeedRegistry.$typeName =
    PriceFeedRegistry.$typeName;
  readonly $fullTypeName: `${string}::config::PriceFeedRegistry`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof PriceFeedRegistry.$isPhantom =
    PriceFeedRegistry.$isPhantom;

  readonly id: ToField<UID>;
  /** AdminCap ID for authorization */
  readonly admin: ToField<ID>;
  /** TypeName string -> PriceFeed config */
  readonly feeds: ToField<Table<ToPhantom<String>, ToPhantom<PriceFeed>>>;
  /** Cached SUI/USD feed ID for routing lookups */
  readonly suiUsdFeedId: ToField<Vector<"u8">>;

  private constructor(typeArgs: [], fields: PriceFeedRegistryFields) {
    this.$fullTypeName = composeSuiType(
      PriceFeedRegistry.$typeName,
      ...typeArgs,
    ) as `${string}::config::PriceFeedRegistry`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.admin = fields.admin;
    this.feeds = fields.feeds;
    this.suiUsdFeedId = fields.suiUsdFeedId;
  }

  static reified(): PriceFeedRegistryReified {
    const reifiedBcs = PriceFeedRegistry.bcs;
    return {
      typeName: PriceFeedRegistry.$typeName,
      fullTypeName: composeSuiType(
        PriceFeedRegistry.$typeName,
        ...[],
      ) as `${string}::config::PriceFeedRegistry`,
      typeArgs: [] as [],
      isPhantom: PriceFeedRegistry.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        PriceFeedRegistry.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PriceFeedRegistry.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        PriceFeedRegistry.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => PriceFeedRegistry.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => PriceFeedRegistry.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PriceFeedRegistry.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PriceFeedRegistry.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PriceFeedRegistry.fetch(client, id),
      new: (fields: PriceFeedRegistryFields) => {
        return new PriceFeedRegistry([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): PriceFeedRegistryReified {
    return PriceFeedRegistry.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<PriceFeedRegistry>> {
    return phantom(PriceFeedRegistry.reified());
  }

  static get p(): PhantomReified<ToTypeStr<PriceFeedRegistry>> {
    return PriceFeedRegistry.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("PriceFeedRegistry", {
      id: UID.bcs,
      admin: ID.bcs,
      feeds: Table.bcs,
      sui_usd_feed_id: bcs.vector(bcs.u8()),
    });
  }

  private static cachedBcs: ReturnType<
    typeof PriceFeedRegistry.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof PriceFeedRegistry.instantiateBcs> {
    if (!PriceFeedRegistry.cachedBcs) {
      PriceFeedRegistry.cachedBcs = PriceFeedRegistry.instantiateBcs();
    }
    return PriceFeedRegistry.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): PriceFeedRegistry {
    return PriceFeedRegistry.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      admin: decodeFromFields(ID.reified(), fields.admin),
      feeds: decodeFromFields(
        Table.reified(phantom(String.reified()), phantom(PriceFeed.reified())),
        fields.feeds,
      ),
      suiUsdFeedId: decodeFromFields(vector("u8"), fields.sui_usd_feed_id),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): PriceFeedRegistry {
    if (!isPriceFeedRegistry(item.type)) {
      throw new Error("not a PriceFeedRegistry type");
    }

    return PriceFeedRegistry.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      admin: decodeFromFieldsWithTypes(ID.reified(), item.fields.admin),
      feeds: decodeFromFieldsWithTypes(
        Table.reified(phantom(String.reified()), phantom(PriceFeed.reified())),
        item.fields.feeds,
      ),
      suiUsdFeedId: decodeFromFieldsWithTypes(
        vector("u8"),
        item.fields.sui_usd_feed_id,
      ),
    });
  }

  static fromBcs(data: Uint8Array): PriceFeedRegistry {
    return PriceFeedRegistry.fromFields(PriceFeedRegistry.bcs.parse(data));
  }

  toJSONField(): PriceFeedRegistryJSONField {
    return {
      id: this.id,
      admin: this.admin,
      feeds: this.feeds.toJSONField(),
      suiUsdFeedId: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.suiUsdFeedId),
    };
  }

  toJSON(): PriceFeedRegistryJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): PriceFeedRegistry {
    return PriceFeedRegistry.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      admin: decodeFromJSONField(ID.reified(), field.admin),
      feeds: decodeFromJSONField(
        Table.reified(phantom(String.reified()), phantom(PriceFeed.reified())),
        field.feeds,
      ),
      suiUsdFeedId: decodeFromJSONField(vector("u8"), field.suiUsdFeedId),
    });
  }

  static fromJSON(json: Record<string, any>): PriceFeedRegistry {
    if (json.$typeName !== PriceFeedRegistry.$typeName) {
      throw new Error(
        `not a PriceFeedRegistry json object: expected '${PriceFeedRegistry.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return PriceFeedRegistry.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): PriceFeedRegistry {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPriceFeedRegistry(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PriceFeedRegistry object`,
      );
    }
    return PriceFeedRegistry.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): PriceFeedRegistry {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isPriceFeedRegistry(data.bcs.type)
      ) {
        throw new Error(`object at is not a PriceFeedRegistry object`);
      }

      return PriceFeedRegistry.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return PriceFeedRegistry.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<PriceFeedRegistry> {
    const res = await fetchObjectBcs(client, id);
    if (!isPriceFeedRegistry(res.type)) {
      throw new Error(`object at id ${id} is not a PriceFeedRegistry object`);
    }

    return PriceFeedRegistry.fromBcs(res.bcsBytes);
  }
}

/* ============================== ConfigSnapshot =============================== */

export function isConfigSnapshot(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ConfigSnapshot")}::config::ConfigSnapshot`
  );
}

export interface ConfigSnapshotFields {
  feeBps: ToField<"u64">;
  executorRewardPerTrade: ToField<"u64">;
  defaultSlippageBps: ToField<"u64">;
  treasury: ToField<"address">;
}

export type ConfigSnapshotReified = Reified<
  ConfigSnapshot,
  ConfigSnapshotFields
>;

export type ConfigSnapshotJSONField = {
  feeBps: string;
  executorRewardPerTrade: string;
  defaultSlippageBps: string;
  treasury: string;
};

export type ConfigSnapshotJSON = {
  $typeName: typeof ConfigSnapshot.$typeName;
  $typeArgs: [];
} & ConfigSnapshotJSONField;

/**
 * Snapshot of config values at DCA account creation time.
 * Stored in DCA account so config changes don't affect existing accounts.
 */
export class ConfigSnapshot implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ConfigSnapshot` =
    `${getTypeOrigin(
      "dca",
      "config::ConfigSnapshot",
    )}::config::ConfigSnapshot` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ConfigSnapshot.$typeName =
    ConfigSnapshot.$typeName;
  readonly $fullTypeName: `${string}::config::ConfigSnapshot`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ConfigSnapshot.$isPhantom =
    ConfigSnapshot.$isPhantom;

  readonly feeBps: ToField<"u64">;
  readonly executorRewardPerTrade: ToField<"u64">;
  readonly defaultSlippageBps: ToField<"u64">;
  readonly treasury: ToField<"address">;

  private constructor(typeArgs: [], fields: ConfigSnapshotFields) {
    this.$fullTypeName = composeSuiType(
      ConfigSnapshot.$typeName,
      ...typeArgs,
    ) as `${string}::config::ConfigSnapshot`;
    this.$typeArgs = typeArgs;

    this.feeBps = fields.feeBps;
    this.executorRewardPerTrade = fields.executorRewardPerTrade;
    this.defaultSlippageBps = fields.defaultSlippageBps;
    this.treasury = fields.treasury;
  }

  static reified(): ConfigSnapshotReified {
    const reifiedBcs = ConfigSnapshot.bcs;
    return {
      typeName: ConfigSnapshot.$typeName,
      fullTypeName: composeSuiType(
        ConfigSnapshot.$typeName,
        ...[],
      ) as `${string}::config::ConfigSnapshot`,
      typeArgs: [] as [],
      isPhantom: ConfigSnapshot.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ConfigSnapshot.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ConfigSnapshot.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ConfigSnapshot.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ConfigSnapshot.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => ConfigSnapshot.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ConfigSnapshot.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ConfigSnapshot.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ConfigSnapshot.fetch(client, id),
      new: (fields: ConfigSnapshotFields) => {
        return new ConfigSnapshot([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ConfigSnapshotReified {
    return ConfigSnapshot.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ConfigSnapshot>> {
    return phantom(ConfigSnapshot.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ConfigSnapshot>> {
    return ConfigSnapshot.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ConfigSnapshot", {
      fee_bps: bcs.u64(),
      executor_reward_per_trade: bcs.u64(),
      default_slippage_bps: bcs.u64(),
      treasury: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ConfigSnapshot.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ConfigSnapshot.instantiateBcs> {
    if (!ConfigSnapshot.cachedBcs) {
      ConfigSnapshot.cachedBcs = ConfigSnapshot.instantiateBcs();
    }
    return ConfigSnapshot.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ConfigSnapshot {
    return ConfigSnapshot.reified().new({
      feeBps: decodeFromFields("u64", fields.fee_bps),
      executorRewardPerTrade: decodeFromFields(
        "u64",
        fields.executor_reward_per_trade,
      ),
      defaultSlippageBps: decodeFromFields("u64", fields.default_slippage_bps),
      treasury: decodeFromFields("address", fields.treasury),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ConfigSnapshot {
    if (!isConfigSnapshot(item.type)) {
      throw new Error("not a ConfigSnapshot type");
    }

    return ConfigSnapshot.reified().new({
      feeBps: decodeFromFieldsWithTypes("u64", item.fields.fee_bps),
      executorRewardPerTrade: decodeFromFieldsWithTypes(
        "u64",
        item.fields.executor_reward_per_trade,
      ),
      defaultSlippageBps: decodeFromFieldsWithTypes(
        "u64",
        item.fields.default_slippage_bps,
      ),
      treasury: decodeFromFieldsWithTypes("address", item.fields.treasury),
    });
  }

  static fromBcs(data: Uint8Array): ConfigSnapshot {
    return ConfigSnapshot.fromFields(ConfigSnapshot.bcs.parse(data));
  }

  toJSONField(): ConfigSnapshotJSONField {
    return {
      feeBps: this.feeBps.toString(),
      executorRewardPerTrade: this.executorRewardPerTrade.toString(),
      defaultSlippageBps: this.defaultSlippageBps.toString(),
      treasury: this.treasury,
    };
  }

  toJSON(): ConfigSnapshotJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ConfigSnapshot {
    return ConfigSnapshot.reified().new({
      feeBps: decodeFromJSONField("u64", field.feeBps),
      executorRewardPerTrade: decodeFromJSONField(
        "u64",
        field.executorRewardPerTrade,
      ),
      defaultSlippageBps: decodeFromJSONField("u64", field.defaultSlippageBps),
      treasury: decodeFromJSONField("address", field.treasury),
    });
  }

  static fromJSON(json: Record<string, any>): ConfigSnapshot {
    if (json.$typeName !== ConfigSnapshot.$typeName) {
      throw new Error(
        `not a ConfigSnapshot json object: expected '${ConfigSnapshot.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ConfigSnapshot.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ConfigSnapshot {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isConfigSnapshot(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ConfigSnapshot object`,
      );
    }
    return ConfigSnapshot.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ConfigSnapshot {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isConfigSnapshot(data.bcs.type)
      ) {
        throw new Error(`object at is not a ConfigSnapshot object`);
      }

      return ConfigSnapshot.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ConfigSnapshot.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ConfigSnapshot> {
    const res = await fetchObjectBcs(client, id);
    if (!isConfigSnapshot(res.type)) {
      throw new Error(`object at id ${id} is not a ConfigSnapshot object`);
    }

    return ConfigSnapshot.fromBcs(res.bcsBytes);
  }
}

/* ============================== ConfigCreatedEvent =============================== */

export function isConfigCreatedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ConfigCreatedEvent")}::config::ConfigCreatedEvent`
  );
}

export interface ConfigCreatedEventFields {
  configId: ToField<ID>;
  feeTrackerId: ToField<ID>;
  adminCapId: ToField<ID>;
  treasury: ToField<"address">;
}

export type ConfigCreatedEventReified = Reified<
  ConfigCreatedEvent,
  ConfigCreatedEventFields
>;

export type ConfigCreatedEventJSONField = {
  configId: string;
  feeTrackerId: string;
  adminCapId: string;
  treasury: string;
};

export type ConfigCreatedEventJSON = {
  $typeName: typeof ConfigCreatedEvent.$typeName;
  $typeArgs: [];
} & ConfigCreatedEventJSONField;

export class ConfigCreatedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ConfigCreatedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ConfigCreatedEvent",
    )}::config::ConfigCreatedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ConfigCreatedEvent.$typeName =
    ConfigCreatedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ConfigCreatedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ConfigCreatedEvent.$isPhantom =
    ConfigCreatedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly feeTrackerId: ToField<ID>;
  readonly adminCapId: ToField<ID>;
  readonly treasury: ToField<"address">;

  private constructor(typeArgs: [], fields: ConfigCreatedEventFields) {
    this.$fullTypeName = composeSuiType(
      ConfigCreatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ConfigCreatedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.feeTrackerId = fields.feeTrackerId;
    this.adminCapId = fields.adminCapId;
    this.treasury = fields.treasury;
  }

  static reified(): ConfigCreatedEventReified {
    const reifiedBcs = ConfigCreatedEvent.bcs;
    return {
      typeName: ConfigCreatedEvent.$typeName,
      fullTypeName: composeSuiType(
        ConfigCreatedEvent.$typeName,
        ...[],
      ) as `${string}::config::ConfigCreatedEvent`,
      typeArgs: [] as [],
      isPhantom: ConfigCreatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ConfigCreatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ConfigCreatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ConfigCreatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ConfigCreatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ConfigCreatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ConfigCreatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ConfigCreatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ConfigCreatedEvent.fetch(client, id),
      new: (fields: ConfigCreatedEventFields) => {
        return new ConfigCreatedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ConfigCreatedEventReified {
    return ConfigCreatedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ConfigCreatedEvent>> {
    return phantom(ConfigCreatedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ConfigCreatedEvent>> {
    return ConfigCreatedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ConfigCreatedEvent", {
      config_id: ID.bcs,
      fee_tracker_id: ID.bcs,
      admin_cap_id: ID.bcs,
      treasury: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ConfigCreatedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ConfigCreatedEvent.instantiateBcs> {
    if (!ConfigCreatedEvent.cachedBcs) {
      ConfigCreatedEvent.cachedBcs = ConfigCreatedEvent.instantiateBcs();
    }
    return ConfigCreatedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ConfigCreatedEvent {
    return ConfigCreatedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      feeTrackerId: decodeFromFields(ID.reified(), fields.fee_tracker_id),
      adminCapId: decodeFromFields(ID.reified(), fields.admin_cap_id),
      treasury: decodeFromFields("address", fields.treasury),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ConfigCreatedEvent {
    if (!isConfigCreatedEvent(item.type)) {
      throw new Error("not a ConfigCreatedEvent type");
    }

    return ConfigCreatedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      feeTrackerId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.fee_tracker_id,
      ),
      adminCapId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.admin_cap_id,
      ),
      treasury: decodeFromFieldsWithTypes("address", item.fields.treasury),
    });
  }

  static fromBcs(data: Uint8Array): ConfigCreatedEvent {
    return ConfigCreatedEvent.fromFields(ConfigCreatedEvent.bcs.parse(data));
  }

  toJSONField(): ConfigCreatedEventJSONField {
    return {
      configId: this.configId,
      feeTrackerId: this.feeTrackerId,
      adminCapId: this.adminCapId,
      treasury: this.treasury,
    };
  }

  toJSON(): ConfigCreatedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ConfigCreatedEvent {
    return ConfigCreatedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      feeTrackerId: decodeFromJSONField(ID.reified(), field.feeTrackerId),
      adminCapId: decodeFromJSONField(ID.reified(), field.adminCapId),
      treasury: decodeFromJSONField("address", field.treasury),
    });
  }

  static fromJSON(json: Record<string, any>): ConfigCreatedEvent {
    if (json.$typeName !== ConfigCreatedEvent.$typeName) {
      throw new Error(
        `not a ConfigCreatedEvent json object: expected '${ConfigCreatedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ConfigCreatedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ConfigCreatedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isConfigCreatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ConfigCreatedEvent object`,
      );
    }
    return ConfigCreatedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ConfigCreatedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isConfigCreatedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a ConfigCreatedEvent object`);
      }

      return ConfigCreatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ConfigCreatedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ConfigCreatedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isConfigCreatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a ConfigCreatedEvent object`);
    }

    return ConfigCreatedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== ConfigUpdatedEvent =============================== */

export function isConfigUpdatedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ConfigUpdatedEvent")}::config::ConfigUpdatedEvent`
  );
}

export interface ConfigUpdatedEventFields {
  configId: ToField<ID>;
  feeBps: ToField<"u64">;
  executorRewardPerTrade: ToField<"u64">;
  maxOrdersPerAccount: ToField<"u64">;
  minFundingPerTrade: ToField<"u64">;
  defaultSlippageBps: ToField<"u64">;
  maxSlippageBps: ToField<"u64">;
  minIntervalSeconds: ToField<"u64">;
}

export type ConfigUpdatedEventReified = Reified<
  ConfigUpdatedEvent,
  ConfigUpdatedEventFields
>;

export type ConfigUpdatedEventJSONField = {
  configId: string;
  feeBps: string;
  executorRewardPerTrade: string;
  maxOrdersPerAccount: string;
  minFundingPerTrade: string;
  defaultSlippageBps: string;
  maxSlippageBps: string;
  minIntervalSeconds: string;
};

export type ConfigUpdatedEventJSON = {
  $typeName: typeof ConfigUpdatedEvent.$typeName;
  $typeArgs: [];
} & ConfigUpdatedEventJSONField;

export class ConfigUpdatedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ConfigUpdatedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ConfigUpdatedEvent",
    )}::config::ConfigUpdatedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ConfigUpdatedEvent.$typeName =
    ConfigUpdatedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ConfigUpdatedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ConfigUpdatedEvent.$isPhantom =
    ConfigUpdatedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly feeBps: ToField<"u64">;
  readonly executorRewardPerTrade: ToField<"u64">;
  readonly maxOrdersPerAccount: ToField<"u64">;
  readonly minFundingPerTrade: ToField<"u64">;
  readonly defaultSlippageBps: ToField<"u64">;
  readonly maxSlippageBps: ToField<"u64">;
  readonly minIntervalSeconds: ToField<"u64">;

  private constructor(typeArgs: [], fields: ConfigUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      ConfigUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ConfigUpdatedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.feeBps = fields.feeBps;
    this.executorRewardPerTrade = fields.executorRewardPerTrade;
    this.maxOrdersPerAccount = fields.maxOrdersPerAccount;
    this.minFundingPerTrade = fields.minFundingPerTrade;
    this.defaultSlippageBps = fields.defaultSlippageBps;
    this.maxSlippageBps = fields.maxSlippageBps;
    this.minIntervalSeconds = fields.minIntervalSeconds;
  }

  static reified(): ConfigUpdatedEventReified {
    const reifiedBcs = ConfigUpdatedEvent.bcs;
    return {
      typeName: ConfigUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        ConfigUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::config::ConfigUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: ConfigUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ConfigUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ConfigUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ConfigUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ConfigUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ConfigUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ConfigUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ConfigUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ConfigUpdatedEvent.fetch(client, id),
      new: (fields: ConfigUpdatedEventFields) => {
        return new ConfigUpdatedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ConfigUpdatedEventReified {
    return ConfigUpdatedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ConfigUpdatedEvent>> {
    return phantom(ConfigUpdatedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ConfigUpdatedEvent>> {
    return ConfigUpdatedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ConfigUpdatedEvent", {
      config_id: ID.bcs,
      fee_bps: bcs.u64(),
      executor_reward_per_trade: bcs.u64(),
      max_orders_per_account: bcs.u64(),
      min_funding_per_trade: bcs.u64(),
      default_slippage_bps: bcs.u64(),
      max_slippage_bps: bcs.u64(),
      min_interval_seconds: bcs.u64(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ConfigUpdatedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ConfigUpdatedEvent.instantiateBcs> {
    if (!ConfigUpdatedEvent.cachedBcs) {
      ConfigUpdatedEvent.cachedBcs = ConfigUpdatedEvent.instantiateBcs();
    }
    return ConfigUpdatedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ConfigUpdatedEvent {
    return ConfigUpdatedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      feeBps: decodeFromFields("u64", fields.fee_bps),
      executorRewardPerTrade: decodeFromFields(
        "u64",
        fields.executor_reward_per_trade,
      ),
      maxOrdersPerAccount: decodeFromFields(
        "u64",
        fields.max_orders_per_account,
      ),
      minFundingPerTrade: decodeFromFields("u64", fields.min_funding_per_trade),
      defaultSlippageBps: decodeFromFields("u64", fields.default_slippage_bps),
      maxSlippageBps: decodeFromFields("u64", fields.max_slippage_bps),
      minIntervalSeconds: decodeFromFields("u64", fields.min_interval_seconds),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ConfigUpdatedEvent {
    if (!isConfigUpdatedEvent(item.type)) {
      throw new Error("not a ConfigUpdatedEvent type");
    }

    return ConfigUpdatedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      feeBps: decodeFromFieldsWithTypes("u64", item.fields.fee_bps),
      executorRewardPerTrade: decodeFromFieldsWithTypes(
        "u64",
        item.fields.executor_reward_per_trade,
      ),
      maxOrdersPerAccount: decodeFromFieldsWithTypes(
        "u64",
        item.fields.max_orders_per_account,
      ),
      minFundingPerTrade: decodeFromFieldsWithTypes(
        "u64",
        item.fields.min_funding_per_trade,
      ),
      defaultSlippageBps: decodeFromFieldsWithTypes(
        "u64",
        item.fields.default_slippage_bps,
      ),
      maxSlippageBps: decodeFromFieldsWithTypes(
        "u64",
        item.fields.max_slippage_bps,
      ),
      minIntervalSeconds: decodeFromFieldsWithTypes(
        "u64",
        item.fields.min_interval_seconds,
      ),
    });
  }

  static fromBcs(data: Uint8Array): ConfigUpdatedEvent {
    return ConfigUpdatedEvent.fromFields(ConfigUpdatedEvent.bcs.parse(data));
  }

  toJSONField(): ConfigUpdatedEventJSONField {
    return {
      configId: this.configId,
      feeBps: this.feeBps.toString(),
      executorRewardPerTrade: this.executorRewardPerTrade.toString(),
      maxOrdersPerAccount: this.maxOrdersPerAccount.toString(),
      minFundingPerTrade: this.minFundingPerTrade.toString(),
      defaultSlippageBps: this.defaultSlippageBps.toString(),
      maxSlippageBps: this.maxSlippageBps.toString(),
      minIntervalSeconds: this.minIntervalSeconds.toString(),
    };
  }

  toJSON(): ConfigUpdatedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ConfigUpdatedEvent {
    return ConfigUpdatedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      feeBps: decodeFromJSONField("u64", field.feeBps),
      executorRewardPerTrade: decodeFromJSONField(
        "u64",
        field.executorRewardPerTrade,
      ),
      maxOrdersPerAccount: decodeFromJSONField(
        "u64",
        field.maxOrdersPerAccount,
      ),
      minFundingPerTrade: decodeFromJSONField("u64", field.minFundingPerTrade),
      defaultSlippageBps: decodeFromJSONField("u64", field.defaultSlippageBps),
      maxSlippageBps: decodeFromJSONField("u64", field.maxSlippageBps),
      minIntervalSeconds: decodeFromJSONField("u64", field.minIntervalSeconds),
    });
  }

  static fromJSON(json: Record<string, any>): ConfigUpdatedEvent {
    if (json.$typeName !== ConfigUpdatedEvent.$typeName) {
      throw new Error(
        `not a ConfigUpdatedEvent json object: expected '${ConfigUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ConfigUpdatedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ConfigUpdatedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isConfigUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ConfigUpdatedEvent object`,
      );
    }
    return ConfigUpdatedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ConfigUpdatedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isConfigUpdatedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a ConfigUpdatedEvent object`);
      }

      return ConfigUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ConfigUpdatedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ConfigUpdatedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isConfigUpdatedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a ConfigUpdatedEvent object`);
    }

    return ConfigUpdatedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== TreasuryUpdatedEvent =============================== */

export function isTreasuryUpdatedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::TreasuryUpdatedEvent")}::config::TreasuryUpdatedEvent`
  );
}

export interface TreasuryUpdatedEventFields {
  configId: ToField<ID>;
  oldTreasury: ToField<"address">;
  newTreasury: ToField<"address">;
}

export type TreasuryUpdatedEventReified = Reified<
  TreasuryUpdatedEvent,
  TreasuryUpdatedEventFields
>;

export type TreasuryUpdatedEventJSONField = {
  configId: string;
  oldTreasury: string;
  newTreasury: string;
};

export type TreasuryUpdatedEventJSON = {
  $typeName: typeof TreasuryUpdatedEvent.$typeName;
  $typeArgs: [];
} & TreasuryUpdatedEventJSONField;

export class TreasuryUpdatedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::TreasuryUpdatedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::TreasuryUpdatedEvent",
    )}::config::TreasuryUpdatedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof TreasuryUpdatedEvent.$typeName =
    TreasuryUpdatedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::TreasuryUpdatedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof TreasuryUpdatedEvent.$isPhantom =
    TreasuryUpdatedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly oldTreasury: ToField<"address">;
  readonly newTreasury: ToField<"address">;

  private constructor(typeArgs: [], fields: TreasuryUpdatedEventFields) {
    this.$fullTypeName = composeSuiType(
      TreasuryUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::TreasuryUpdatedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.oldTreasury = fields.oldTreasury;
    this.newTreasury = fields.newTreasury;
  }

  static reified(): TreasuryUpdatedEventReified {
    const reifiedBcs = TreasuryUpdatedEvent.bcs;
    return {
      typeName: TreasuryUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        TreasuryUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::config::TreasuryUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: TreasuryUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        TreasuryUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        TreasuryUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        TreasuryUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => TreasuryUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        TreasuryUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        TreasuryUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        TreasuryUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        TreasuryUpdatedEvent.fetch(client, id),
      new: (fields: TreasuryUpdatedEventFields) => {
        return new TreasuryUpdatedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): TreasuryUpdatedEventReified {
    return TreasuryUpdatedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<TreasuryUpdatedEvent>> {
    return phantom(TreasuryUpdatedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<TreasuryUpdatedEvent>> {
    return TreasuryUpdatedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("TreasuryUpdatedEvent", {
      config_id: ID.bcs,
      old_treasury: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
      new_treasury: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof TreasuryUpdatedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof TreasuryUpdatedEvent.instantiateBcs> {
    if (!TreasuryUpdatedEvent.cachedBcs) {
      TreasuryUpdatedEvent.cachedBcs = TreasuryUpdatedEvent.instantiateBcs();
    }
    return TreasuryUpdatedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): TreasuryUpdatedEvent {
    return TreasuryUpdatedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      oldTreasury: decodeFromFields("address", fields.old_treasury),
      newTreasury: decodeFromFields("address", fields.new_treasury),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): TreasuryUpdatedEvent {
    if (!isTreasuryUpdatedEvent(item.type)) {
      throw new Error("not a TreasuryUpdatedEvent type");
    }

    return TreasuryUpdatedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      oldTreasury: decodeFromFieldsWithTypes(
        "address",
        item.fields.old_treasury,
      ),
      newTreasury: decodeFromFieldsWithTypes(
        "address",
        item.fields.new_treasury,
      ),
    });
  }

  static fromBcs(data: Uint8Array): TreasuryUpdatedEvent {
    return TreasuryUpdatedEvent.fromFields(
      TreasuryUpdatedEvent.bcs.parse(data),
    );
  }

  toJSONField(): TreasuryUpdatedEventJSONField {
    return {
      configId: this.configId,
      oldTreasury: this.oldTreasury,
      newTreasury: this.newTreasury,
    };
  }

  toJSON(): TreasuryUpdatedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): TreasuryUpdatedEvent {
    return TreasuryUpdatedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      oldTreasury: decodeFromJSONField("address", field.oldTreasury),
      newTreasury: decodeFromJSONField("address", field.newTreasury),
    });
  }

  static fromJSON(json: Record<string, any>): TreasuryUpdatedEvent {
    if (json.$typeName !== TreasuryUpdatedEvent.$typeName) {
      throw new Error(
        `not a TreasuryUpdatedEvent json object: expected '${TreasuryUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return TreasuryUpdatedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): TreasuryUpdatedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isTreasuryUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a TreasuryUpdatedEvent object`,
      );
    }
    return TreasuryUpdatedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): TreasuryUpdatedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isTreasuryUpdatedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a TreasuryUpdatedEvent object`);
      }

      return TreasuryUpdatedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return TreasuryUpdatedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<TreasuryUpdatedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isTreasuryUpdatedEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a TreasuryUpdatedEvent object`,
      );
    }

    return TreasuryUpdatedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== ProtocolPausedEvent =============================== */

export function isProtocolPausedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ProtocolPausedEvent")}::config::ProtocolPausedEvent`
  );
}

export interface ProtocolPausedEventFields {
  configId: ToField<ID>;
  paused: ToField<"bool">;
}

export type ProtocolPausedEventReified = Reified<
  ProtocolPausedEvent,
  ProtocolPausedEventFields
>;

export type ProtocolPausedEventJSONField = {
  configId: string;
  paused: boolean;
};

export type ProtocolPausedEventJSON = {
  $typeName: typeof ProtocolPausedEvent.$typeName;
  $typeArgs: [];
} & ProtocolPausedEventJSONField;

export class ProtocolPausedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ProtocolPausedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ProtocolPausedEvent",
    )}::config::ProtocolPausedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ProtocolPausedEvent.$typeName =
    ProtocolPausedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ProtocolPausedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ProtocolPausedEvent.$isPhantom =
    ProtocolPausedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly paused: ToField<"bool">;

  private constructor(typeArgs: [], fields: ProtocolPausedEventFields) {
    this.$fullTypeName = composeSuiType(
      ProtocolPausedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ProtocolPausedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.paused = fields.paused;
  }

  static reified(): ProtocolPausedEventReified {
    const reifiedBcs = ProtocolPausedEvent.bcs;
    return {
      typeName: ProtocolPausedEvent.$typeName,
      fullTypeName: composeSuiType(
        ProtocolPausedEvent.$typeName,
        ...[],
      ) as `${string}::config::ProtocolPausedEvent`,
      typeArgs: [] as [],
      isPhantom: ProtocolPausedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ProtocolPausedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ProtocolPausedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ProtocolPausedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ProtocolPausedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ProtocolPausedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ProtocolPausedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ProtocolPausedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ProtocolPausedEvent.fetch(client, id),
      new: (fields: ProtocolPausedEventFields) => {
        return new ProtocolPausedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ProtocolPausedEventReified {
    return ProtocolPausedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ProtocolPausedEvent>> {
    return phantom(ProtocolPausedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ProtocolPausedEvent>> {
    return ProtocolPausedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ProtocolPausedEvent", {
      config_id: ID.bcs,
      paused: bcs.bool(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ProtocolPausedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ProtocolPausedEvent.instantiateBcs> {
    if (!ProtocolPausedEvent.cachedBcs) {
      ProtocolPausedEvent.cachedBcs = ProtocolPausedEvent.instantiateBcs();
    }
    return ProtocolPausedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ProtocolPausedEvent {
    return ProtocolPausedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      paused: decodeFromFields("bool", fields.paused),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ProtocolPausedEvent {
    if (!isProtocolPausedEvent(item.type)) {
      throw new Error("not a ProtocolPausedEvent type");
    }

    return ProtocolPausedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      paused: decodeFromFieldsWithTypes("bool", item.fields.paused),
    });
  }

  static fromBcs(data: Uint8Array): ProtocolPausedEvent {
    return ProtocolPausedEvent.fromFields(ProtocolPausedEvent.bcs.parse(data));
  }

  toJSONField(): ProtocolPausedEventJSONField {
    return {
      configId: this.configId,
      paused: this.paused,
    };
  }

  toJSON(): ProtocolPausedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ProtocolPausedEvent {
    return ProtocolPausedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      paused: decodeFromJSONField("bool", field.paused),
    });
  }

  static fromJSON(json: Record<string, any>): ProtocolPausedEvent {
    if (json.$typeName !== ProtocolPausedEvent.$typeName) {
      throw new Error(
        `not a ProtocolPausedEvent json object: expected '${ProtocolPausedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ProtocolPausedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ProtocolPausedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isProtocolPausedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ProtocolPausedEvent object`,
      );
    }
    return ProtocolPausedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ProtocolPausedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isProtocolPausedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a ProtocolPausedEvent object`);
      }

      return ProtocolPausedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ProtocolPausedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ProtocolPausedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isProtocolPausedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a ProtocolPausedEvent object`);
    }

    return ProtocolPausedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== FeesWithdrawnEvent =============================== */

export function isFeesWithdrawnEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::FeesWithdrawnEvent")}::config::FeesWithdrawnEvent`
  );
}

export interface FeesWithdrawnEventFields {
  feeTrackerId: ToField<ID>;
  amount: ToField<"u64">;
  recipient: ToField<"address">;
}

export type FeesWithdrawnEventReified = Reified<
  FeesWithdrawnEvent,
  FeesWithdrawnEventFields
>;

export type FeesWithdrawnEventJSONField = {
  feeTrackerId: string;
  amount: string;
  recipient: string;
};

export type FeesWithdrawnEventJSON = {
  $typeName: typeof FeesWithdrawnEvent.$typeName;
  $typeArgs: [];
} & FeesWithdrawnEventJSONField;

export class FeesWithdrawnEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::FeesWithdrawnEvent` =
    `${getTypeOrigin(
      "dca",
      "config::FeesWithdrawnEvent",
    )}::config::FeesWithdrawnEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof FeesWithdrawnEvent.$typeName =
    FeesWithdrawnEvent.$typeName;
  readonly $fullTypeName: `${string}::config::FeesWithdrawnEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof FeesWithdrawnEvent.$isPhantom =
    FeesWithdrawnEvent.$isPhantom;

  readonly feeTrackerId: ToField<ID>;
  readonly amount: ToField<"u64">;
  readonly recipient: ToField<"address">;

  private constructor(typeArgs: [], fields: FeesWithdrawnEventFields) {
    this.$fullTypeName = composeSuiType(
      FeesWithdrawnEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::FeesWithdrawnEvent`;
    this.$typeArgs = typeArgs;

    this.feeTrackerId = fields.feeTrackerId;
    this.amount = fields.amount;
    this.recipient = fields.recipient;
  }

  static reified(): FeesWithdrawnEventReified {
    const reifiedBcs = FeesWithdrawnEvent.bcs;
    return {
      typeName: FeesWithdrawnEvent.$typeName,
      fullTypeName: composeSuiType(
        FeesWithdrawnEvent.$typeName,
        ...[],
      ) as `${string}::config::FeesWithdrawnEvent`,
      typeArgs: [] as [],
      isPhantom: FeesWithdrawnEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        FeesWithdrawnEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        FeesWithdrawnEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        FeesWithdrawnEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => FeesWithdrawnEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        FeesWithdrawnEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        FeesWithdrawnEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        FeesWithdrawnEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        FeesWithdrawnEvent.fetch(client, id),
      new: (fields: FeesWithdrawnEventFields) => {
        return new FeesWithdrawnEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): FeesWithdrawnEventReified {
    return FeesWithdrawnEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<FeesWithdrawnEvent>> {
    return phantom(FeesWithdrawnEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<FeesWithdrawnEvent>> {
    return FeesWithdrawnEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("FeesWithdrawnEvent", {
      fee_tracker_id: ID.bcs,
      amount: bcs.u64(),
      recipient: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof FeesWithdrawnEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof FeesWithdrawnEvent.instantiateBcs> {
    if (!FeesWithdrawnEvent.cachedBcs) {
      FeesWithdrawnEvent.cachedBcs = FeesWithdrawnEvent.instantiateBcs();
    }
    return FeesWithdrawnEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): FeesWithdrawnEvent {
    return FeesWithdrawnEvent.reified().new({
      feeTrackerId: decodeFromFields(ID.reified(), fields.fee_tracker_id),
      amount: decodeFromFields("u64", fields.amount),
      recipient: decodeFromFields("address", fields.recipient),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): FeesWithdrawnEvent {
    if (!isFeesWithdrawnEvent(item.type)) {
      throw new Error("not a FeesWithdrawnEvent type");
    }

    return FeesWithdrawnEvent.reified().new({
      feeTrackerId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.fee_tracker_id,
      ),
      amount: decodeFromFieldsWithTypes("u64", item.fields.amount),
      recipient: decodeFromFieldsWithTypes("address", item.fields.recipient),
    });
  }

  static fromBcs(data: Uint8Array): FeesWithdrawnEvent {
    return FeesWithdrawnEvent.fromFields(FeesWithdrawnEvent.bcs.parse(data));
  }

  toJSONField(): FeesWithdrawnEventJSONField {
    return {
      feeTrackerId: this.feeTrackerId,
      amount: this.amount.toString(),
      recipient: this.recipient,
    };
  }

  toJSON(): FeesWithdrawnEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): FeesWithdrawnEvent {
    return FeesWithdrawnEvent.reified().new({
      feeTrackerId: decodeFromJSONField(ID.reified(), field.feeTrackerId),
      amount: decodeFromJSONField("u64", field.amount),
      recipient: decodeFromJSONField("address", field.recipient),
    });
  }

  static fromJSON(json: Record<string, any>): FeesWithdrawnEvent {
    if (json.$typeName !== FeesWithdrawnEvent.$typeName) {
      throw new Error(
        `not a FeesWithdrawnEvent json object: expected '${FeesWithdrawnEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return FeesWithdrawnEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): FeesWithdrawnEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isFeesWithdrawnEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a FeesWithdrawnEvent object`,
      );
    }
    return FeesWithdrawnEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): FeesWithdrawnEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isFeesWithdrawnEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a FeesWithdrawnEvent object`);
      }

      return FeesWithdrawnEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return FeesWithdrawnEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<FeesWithdrawnEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isFeesWithdrawnEvent(res.type)) {
      throw new Error(`object at id ${id} is not a FeesWithdrawnEvent object`);
    }

    return FeesWithdrawnEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== PriceFeedRegistryCreatedEvent =============================== */

export function isPriceFeedRegistryCreatedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRegistryCreatedEvent",
    )}::config::PriceFeedRegistryCreatedEvent`
  );
}

export interface PriceFeedRegistryCreatedEventFields {
  registryId: ToField<ID>;
  adminCapId: ToField<ID>;
}

export type PriceFeedRegistryCreatedEventReified = Reified<
  PriceFeedRegistryCreatedEvent,
  PriceFeedRegistryCreatedEventFields
>;

export type PriceFeedRegistryCreatedEventJSONField = {
  registryId: string;
  adminCapId: string;
};

export type PriceFeedRegistryCreatedEventJSON = {
  $typeName: typeof PriceFeedRegistryCreatedEvent.$typeName;
  $typeArgs: [];
} & PriceFeedRegistryCreatedEventJSONField;

export class PriceFeedRegistryCreatedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::PriceFeedRegistryCreatedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRegistryCreatedEvent",
    )}::config::PriceFeedRegistryCreatedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof PriceFeedRegistryCreatedEvent.$typeName =
    PriceFeedRegistryCreatedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::PriceFeedRegistryCreatedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof PriceFeedRegistryCreatedEvent.$isPhantom =
    PriceFeedRegistryCreatedEvent.$isPhantom;

  readonly registryId: ToField<ID>;
  readonly adminCapId: ToField<ID>;

  private constructor(
    typeArgs: [],
    fields: PriceFeedRegistryCreatedEventFields,
  ) {
    this.$fullTypeName = composeSuiType(
      PriceFeedRegistryCreatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::PriceFeedRegistryCreatedEvent`;
    this.$typeArgs = typeArgs;

    this.registryId = fields.registryId;
    this.adminCapId = fields.adminCapId;
  }

  static reified(): PriceFeedRegistryCreatedEventReified {
    const reifiedBcs = PriceFeedRegistryCreatedEvent.bcs;
    return {
      typeName: PriceFeedRegistryCreatedEvent.$typeName,
      fullTypeName: composeSuiType(
        PriceFeedRegistryCreatedEvent.$typeName,
        ...[],
      ) as `${string}::config::PriceFeedRegistryCreatedEvent`,
      typeArgs: [] as [],
      isPhantom: PriceFeedRegistryCreatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        PriceFeedRegistryCreatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PriceFeedRegistryCreatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        PriceFeedRegistryCreatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) =>
        PriceFeedRegistryCreatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        PriceFeedRegistryCreatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PriceFeedRegistryCreatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PriceFeedRegistryCreatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PriceFeedRegistryCreatedEvent.fetch(client, id),
      new: (fields: PriceFeedRegistryCreatedEventFields) => {
        return new PriceFeedRegistryCreatedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): PriceFeedRegistryCreatedEventReified {
    return PriceFeedRegistryCreatedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<PriceFeedRegistryCreatedEvent>> {
    return phantom(PriceFeedRegistryCreatedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<PriceFeedRegistryCreatedEvent>> {
    return PriceFeedRegistryCreatedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("PriceFeedRegistryCreatedEvent", {
      registry_id: ID.bcs,
      admin_cap_id: ID.bcs,
    });
  }

  private static cachedBcs: ReturnType<
    typeof PriceFeedRegistryCreatedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<
    typeof PriceFeedRegistryCreatedEvent.instantiateBcs
  > {
    if (!PriceFeedRegistryCreatedEvent.cachedBcs) {
      PriceFeedRegistryCreatedEvent.cachedBcs =
        PriceFeedRegistryCreatedEvent.instantiateBcs();
    }
    return PriceFeedRegistryCreatedEvent.cachedBcs;
  }

  static fromFields(
    fields: Record<string, any>,
  ): PriceFeedRegistryCreatedEvent {
    return PriceFeedRegistryCreatedEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      adminCapId: decodeFromFields(ID.reified(), fields.admin_cap_id),
    });
  }

  static fromFieldsWithTypes(
    item: FieldsWithTypes,
  ): PriceFeedRegistryCreatedEvent {
    if (!isPriceFeedRegistryCreatedEvent(item.type)) {
      throw new Error("not a PriceFeedRegistryCreatedEvent type");
    }

    return PriceFeedRegistryCreatedEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.registry_id,
      ),
      adminCapId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.admin_cap_id,
      ),
    });
  }

  static fromBcs(data: Uint8Array): PriceFeedRegistryCreatedEvent {
    return PriceFeedRegistryCreatedEvent.fromFields(
      PriceFeedRegistryCreatedEvent.bcs.parse(data),
    );
  }

  toJSONField(): PriceFeedRegistryCreatedEventJSONField {
    return {
      registryId: this.registryId,
      adminCapId: this.adminCapId,
    };
  }

  toJSON(): PriceFeedRegistryCreatedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): PriceFeedRegistryCreatedEvent {
    return PriceFeedRegistryCreatedEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      adminCapId: decodeFromJSONField(ID.reified(), field.adminCapId),
    });
  }

  static fromJSON(json: Record<string, any>): PriceFeedRegistryCreatedEvent {
    if (json.$typeName !== PriceFeedRegistryCreatedEvent.$typeName) {
      throw new Error(
        `not a PriceFeedRegistryCreatedEvent json object: expected '${PriceFeedRegistryCreatedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return PriceFeedRegistryCreatedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(
    content: SuiParsedData,
  ): PriceFeedRegistryCreatedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPriceFeedRegistryCreatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PriceFeedRegistryCreatedEvent object`,
      );
    }
    return PriceFeedRegistryCreatedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): PriceFeedRegistryCreatedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isPriceFeedRegistryCreatedEvent(data.bcs.type)
      ) {
        throw new Error(
          `object at is not a PriceFeedRegistryCreatedEvent object`,
        );
      }

      return PriceFeedRegistryCreatedEvent.fromBcs(
        fromBase64(data.bcs.bcsBytes),
      );
    }
    if (data.content) {
      return PriceFeedRegistryCreatedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<PriceFeedRegistryCreatedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isPriceFeedRegistryCreatedEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a PriceFeedRegistryCreatedEvent object`,
      );
    }

    return PriceFeedRegistryCreatedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== PriceFeedRegisteredEvent =============================== */

export function isPriceFeedRegisteredEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRegisteredEvent",
    )}::config::PriceFeedRegisteredEvent`
  );
}

export interface PriceFeedRegisteredEventFields {
  registryId: ToField<ID>;
  coinType: ToField<String>;
  feedId: ToField<Vector<"u8">>;
  quoteCurrency: ToField<"u8">;
  isRouted: ToField<"bool">;
}

export type PriceFeedRegisteredEventReified = Reified<
  PriceFeedRegisteredEvent,
  PriceFeedRegisteredEventFields
>;

export type PriceFeedRegisteredEventJSONField = {
  registryId: string;
  coinType: string;
  feedId: number[];
  quoteCurrency: number;
  isRouted: boolean;
};

export type PriceFeedRegisteredEventJSON = {
  $typeName: typeof PriceFeedRegisteredEvent.$typeName;
  $typeArgs: [];
} & PriceFeedRegisteredEventJSONField;

export class PriceFeedRegisteredEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::PriceFeedRegisteredEvent` =
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRegisteredEvent",
    )}::config::PriceFeedRegisteredEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof PriceFeedRegisteredEvent.$typeName =
    PriceFeedRegisteredEvent.$typeName;
  readonly $fullTypeName: `${string}::config::PriceFeedRegisteredEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof PriceFeedRegisteredEvent.$isPhantom =
    PriceFeedRegisteredEvent.$isPhantom;

  readonly registryId: ToField<ID>;
  readonly coinType: ToField<String>;
  readonly feedId: ToField<Vector<"u8">>;
  readonly quoteCurrency: ToField<"u8">;
  readonly isRouted: ToField<"bool">;

  private constructor(typeArgs: [], fields: PriceFeedRegisteredEventFields) {
    this.$fullTypeName = composeSuiType(
      PriceFeedRegisteredEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::PriceFeedRegisteredEvent`;
    this.$typeArgs = typeArgs;

    this.registryId = fields.registryId;
    this.coinType = fields.coinType;
    this.feedId = fields.feedId;
    this.quoteCurrency = fields.quoteCurrency;
    this.isRouted = fields.isRouted;
  }

  static reified(): PriceFeedRegisteredEventReified {
    const reifiedBcs = PriceFeedRegisteredEvent.bcs;
    return {
      typeName: PriceFeedRegisteredEvent.$typeName,
      fullTypeName: composeSuiType(
        PriceFeedRegisteredEvent.$typeName,
        ...[],
      ) as `${string}::config::PriceFeedRegisteredEvent`,
      typeArgs: [] as [],
      isPhantom: PriceFeedRegisteredEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        PriceFeedRegisteredEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PriceFeedRegisteredEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        PriceFeedRegisteredEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) =>
        PriceFeedRegisteredEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        PriceFeedRegisteredEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PriceFeedRegisteredEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PriceFeedRegisteredEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PriceFeedRegisteredEvent.fetch(client, id),
      new: (fields: PriceFeedRegisteredEventFields) => {
        return new PriceFeedRegisteredEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): PriceFeedRegisteredEventReified {
    return PriceFeedRegisteredEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<PriceFeedRegisteredEvent>> {
    return phantom(PriceFeedRegisteredEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<PriceFeedRegisteredEvent>> {
    return PriceFeedRegisteredEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("PriceFeedRegisteredEvent", {
      registry_id: ID.bcs,
      coin_type: String.bcs,
      feed_id: bcs.vector(bcs.u8()),
      quote_currency: bcs.u8(),
      is_routed: bcs.bool(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof PriceFeedRegisteredEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof PriceFeedRegisteredEvent.instantiateBcs> {
    if (!PriceFeedRegisteredEvent.cachedBcs) {
      PriceFeedRegisteredEvent.cachedBcs =
        PriceFeedRegisteredEvent.instantiateBcs();
    }
    return PriceFeedRegisteredEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): PriceFeedRegisteredEvent {
    return PriceFeedRegisteredEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      coinType: decodeFromFields(String.reified(), fields.coin_type),
      feedId: decodeFromFields(vector("u8"), fields.feed_id),
      quoteCurrency: decodeFromFields("u8", fields.quote_currency),
      isRouted: decodeFromFields("bool", fields.is_routed),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): PriceFeedRegisteredEvent {
    if (!isPriceFeedRegisteredEvent(item.type)) {
      throw new Error("not a PriceFeedRegisteredEvent type");
    }

    return PriceFeedRegisteredEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.registry_id,
      ),
      coinType: decodeFromFieldsWithTypes(
        String.reified(),
        item.fields.coin_type,
      ),
      feedId: decodeFromFieldsWithTypes(vector("u8"), item.fields.feed_id),
      quoteCurrency: decodeFromFieldsWithTypes(
        "u8",
        item.fields.quote_currency,
      ),
      isRouted: decodeFromFieldsWithTypes("bool", item.fields.is_routed),
    });
  }

  static fromBcs(data: Uint8Array): PriceFeedRegisteredEvent {
    return PriceFeedRegisteredEvent.fromFields(
      PriceFeedRegisteredEvent.bcs.parse(data),
    );
  }

  toJSONField(): PriceFeedRegisteredEventJSONField {
    return {
      registryId: this.registryId,
      coinType: this.coinType,
      feedId: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.feedId),
      quoteCurrency: this.quoteCurrency,
      isRouted: this.isRouted,
    };
  }

  toJSON(): PriceFeedRegisteredEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): PriceFeedRegisteredEvent {
    return PriceFeedRegisteredEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      coinType: decodeFromJSONField(String.reified(), field.coinType),
      feedId: decodeFromJSONField(vector("u8"), field.feedId),
      quoteCurrency: decodeFromJSONField("u8", field.quoteCurrency),
      isRouted: decodeFromJSONField("bool", field.isRouted),
    });
  }

  static fromJSON(json: Record<string, any>): PriceFeedRegisteredEvent {
    if (json.$typeName !== PriceFeedRegisteredEvent.$typeName) {
      throw new Error(
        `not a PriceFeedRegisteredEvent json object: expected '${PriceFeedRegisteredEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return PriceFeedRegisteredEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): PriceFeedRegisteredEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPriceFeedRegisteredEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PriceFeedRegisteredEvent object`,
      );
    }
    return PriceFeedRegisteredEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): PriceFeedRegisteredEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isPriceFeedRegisteredEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a PriceFeedRegisteredEvent object`);
      }

      return PriceFeedRegisteredEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return PriceFeedRegisteredEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<PriceFeedRegisteredEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isPriceFeedRegisteredEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a PriceFeedRegisteredEvent object`,
      );
    }

    return PriceFeedRegisteredEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== PriceFeedRemovedEvent =============================== */

export function isPriceFeedRemovedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::PriceFeedRemovedEvent")}::config::PriceFeedRemovedEvent`
  );
}

export interface PriceFeedRemovedEventFields {
  registryId: ToField<ID>;
  coinType: ToField<String>;
}

export type PriceFeedRemovedEventReified = Reified<
  PriceFeedRemovedEvent,
  PriceFeedRemovedEventFields
>;

export type PriceFeedRemovedEventJSONField = {
  registryId: string;
  coinType: string;
};

export type PriceFeedRemovedEventJSON = {
  $typeName: typeof PriceFeedRemovedEvent.$typeName;
  $typeArgs: [];
} & PriceFeedRemovedEventJSONField;

export class PriceFeedRemovedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::PriceFeedRemovedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::PriceFeedRemovedEvent",
    )}::config::PriceFeedRemovedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof PriceFeedRemovedEvent.$typeName =
    PriceFeedRemovedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::PriceFeedRemovedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof PriceFeedRemovedEvent.$isPhantom =
    PriceFeedRemovedEvent.$isPhantom;

  readonly registryId: ToField<ID>;
  readonly coinType: ToField<String>;

  private constructor(typeArgs: [], fields: PriceFeedRemovedEventFields) {
    this.$fullTypeName = composeSuiType(
      PriceFeedRemovedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::PriceFeedRemovedEvent`;
    this.$typeArgs = typeArgs;

    this.registryId = fields.registryId;
    this.coinType = fields.coinType;
  }

  static reified(): PriceFeedRemovedEventReified {
    const reifiedBcs = PriceFeedRemovedEvent.bcs;
    return {
      typeName: PriceFeedRemovedEvent.$typeName,
      fullTypeName: composeSuiType(
        PriceFeedRemovedEvent.$typeName,
        ...[],
      ) as `${string}::config::PriceFeedRemovedEvent`,
      typeArgs: [] as [],
      isPhantom: PriceFeedRemovedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        PriceFeedRemovedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        PriceFeedRemovedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        PriceFeedRemovedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => PriceFeedRemovedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        PriceFeedRemovedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        PriceFeedRemovedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        PriceFeedRemovedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        PriceFeedRemovedEvent.fetch(client, id),
      new: (fields: PriceFeedRemovedEventFields) => {
        return new PriceFeedRemovedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): PriceFeedRemovedEventReified {
    return PriceFeedRemovedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<PriceFeedRemovedEvent>> {
    return phantom(PriceFeedRemovedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<PriceFeedRemovedEvent>> {
    return PriceFeedRemovedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("PriceFeedRemovedEvent", {
      registry_id: ID.bcs,
      coin_type: String.bcs,
    });
  }

  private static cachedBcs: ReturnType<
    typeof PriceFeedRemovedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof PriceFeedRemovedEvent.instantiateBcs> {
    if (!PriceFeedRemovedEvent.cachedBcs) {
      PriceFeedRemovedEvent.cachedBcs = PriceFeedRemovedEvent.instantiateBcs();
    }
    return PriceFeedRemovedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): PriceFeedRemovedEvent {
    return PriceFeedRemovedEvent.reified().new({
      registryId: decodeFromFields(ID.reified(), fields.registry_id),
      coinType: decodeFromFields(String.reified(), fields.coin_type),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): PriceFeedRemovedEvent {
    if (!isPriceFeedRemovedEvent(item.type)) {
      throw new Error("not a PriceFeedRemovedEvent type");
    }

    return PriceFeedRemovedEvent.reified().new({
      registryId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.registry_id,
      ),
      coinType: decodeFromFieldsWithTypes(
        String.reified(),
        item.fields.coin_type,
      ),
    });
  }

  static fromBcs(data: Uint8Array): PriceFeedRemovedEvent {
    return PriceFeedRemovedEvent.fromFields(
      PriceFeedRemovedEvent.bcs.parse(data),
    );
  }

  toJSONField(): PriceFeedRemovedEventJSONField {
    return {
      registryId: this.registryId,
      coinType: this.coinType,
    };
  }

  toJSON(): PriceFeedRemovedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): PriceFeedRemovedEvent {
    return PriceFeedRemovedEvent.reified().new({
      registryId: decodeFromJSONField(ID.reified(), field.registryId),
      coinType: decodeFromJSONField(String.reified(), field.coinType),
    });
  }

  static fromJSON(json: Record<string, any>): PriceFeedRemovedEvent {
    if (json.$typeName !== PriceFeedRemovedEvent.$typeName) {
      throw new Error(
        `not a PriceFeedRemovedEvent json object: expected '${PriceFeedRemovedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return PriceFeedRemovedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): PriceFeedRemovedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isPriceFeedRemovedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a PriceFeedRemovedEvent object`,
      );
    }
    return PriceFeedRemovedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): PriceFeedRemovedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isPriceFeedRemovedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a PriceFeedRemovedEvent object`);
      }

      return PriceFeedRemovedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return PriceFeedRemovedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<PriceFeedRemovedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isPriceFeedRemovedEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a PriceFeedRemovedEvent object`,
      );
    }

    return PriceFeedRemovedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== ExecutorWhitelistUpdatedEvent =============================== */

export function isExecutorWhitelistUpdatedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin(
      "dca",
      "config::ExecutorWhitelistUpdatedEvent",
    )}::config::ExecutorWhitelistUpdatedEvent`
  );
}

export interface ExecutorWhitelistUpdatedEventFields {
  configId: ToField<ID>;
  enabled: ToField<"bool">;
}

export type ExecutorWhitelistUpdatedEventReified = Reified<
  ExecutorWhitelistUpdatedEvent,
  ExecutorWhitelistUpdatedEventFields
>;

export type ExecutorWhitelistUpdatedEventJSONField = {
  configId: string;
  enabled: boolean;
};

export type ExecutorWhitelistUpdatedEventJSON = {
  $typeName: typeof ExecutorWhitelistUpdatedEvent.$typeName;
  $typeArgs: [];
} & ExecutorWhitelistUpdatedEventJSONField;

export class ExecutorWhitelistUpdatedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ExecutorWhitelistUpdatedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ExecutorWhitelistUpdatedEvent",
    )}::config::ExecutorWhitelistUpdatedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ExecutorWhitelistUpdatedEvent.$typeName =
    ExecutorWhitelistUpdatedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ExecutorWhitelistUpdatedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ExecutorWhitelistUpdatedEvent.$isPhantom =
    ExecutorWhitelistUpdatedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly enabled: ToField<"bool">;

  private constructor(
    typeArgs: [],
    fields: ExecutorWhitelistUpdatedEventFields,
  ) {
    this.$fullTypeName = composeSuiType(
      ExecutorWhitelistUpdatedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ExecutorWhitelistUpdatedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.enabled = fields.enabled;
  }

  static reified(): ExecutorWhitelistUpdatedEventReified {
    const reifiedBcs = ExecutorWhitelistUpdatedEvent.bcs;
    return {
      typeName: ExecutorWhitelistUpdatedEvent.$typeName,
      fullTypeName: composeSuiType(
        ExecutorWhitelistUpdatedEvent.$typeName,
        ...[],
      ) as `${string}::config::ExecutorWhitelistUpdatedEvent`,
      typeArgs: [] as [],
      isPhantom: ExecutorWhitelistUpdatedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ExecutorWhitelistUpdatedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ExecutorWhitelistUpdatedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ExecutorWhitelistUpdatedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) =>
        ExecutorWhitelistUpdatedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ExecutorWhitelistUpdatedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ExecutorWhitelistUpdatedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ExecutorWhitelistUpdatedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ExecutorWhitelistUpdatedEvent.fetch(client, id),
      new: (fields: ExecutorWhitelistUpdatedEventFields) => {
        return new ExecutorWhitelistUpdatedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ExecutorWhitelistUpdatedEventReified {
    return ExecutorWhitelistUpdatedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ExecutorWhitelistUpdatedEvent>> {
    return phantom(ExecutorWhitelistUpdatedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ExecutorWhitelistUpdatedEvent>> {
    return ExecutorWhitelistUpdatedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ExecutorWhitelistUpdatedEvent", {
      config_id: ID.bcs,
      enabled: bcs.bool(),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ExecutorWhitelistUpdatedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<
    typeof ExecutorWhitelistUpdatedEvent.instantiateBcs
  > {
    if (!ExecutorWhitelistUpdatedEvent.cachedBcs) {
      ExecutorWhitelistUpdatedEvent.cachedBcs =
        ExecutorWhitelistUpdatedEvent.instantiateBcs();
    }
    return ExecutorWhitelistUpdatedEvent.cachedBcs;
  }

  static fromFields(
    fields: Record<string, any>,
  ): ExecutorWhitelistUpdatedEvent {
    return ExecutorWhitelistUpdatedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      enabled: decodeFromFields("bool", fields.enabled),
    });
  }

  static fromFieldsWithTypes(
    item: FieldsWithTypes,
  ): ExecutorWhitelistUpdatedEvent {
    if (!isExecutorWhitelistUpdatedEvent(item.type)) {
      throw new Error("not a ExecutorWhitelistUpdatedEvent type");
    }

    return ExecutorWhitelistUpdatedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      enabled: decodeFromFieldsWithTypes("bool", item.fields.enabled),
    });
  }

  static fromBcs(data: Uint8Array): ExecutorWhitelistUpdatedEvent {
    return ExecutorWhitelistUpdatedEvent.fromFields(
      ExecutorWhitelistUpdatedEvent.bcs.parse(data),
    );
  }

  toJSONField(): ExecutorWhitelistUpdatedEventJSONField {
    return {
      configId: this.configId,
      enabled: this.enabled,
    };
  }

  toJSON(): ExecutorWhitelistUpdatedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ExecutorWhitelistUpdatedEvent {
    return ExecutorWhitelistUpdatedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      enabled: decodeFromJSONField("bool", field.enabled),
    });
  }

  static fromJSON(json: Record<string, any>): ExecutorWhitelistUpdatedEvent {
    if (json.$typeName !== ExecutorWhitelistUpdatedEvent.$typeName) {
      throw new Error(
        `not a ExecutorWhitelistUpdatedEvent json object: expected '${ExecutorWhitelistUpdatedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ExecutorWhitelistUpdatedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(
    content: SuiParsedData,
  ): ExecutorWhitelistUpdatedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isExecutorWhitelistUpdatedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ExecutorWhitelistUpdatedEvent object`,
      );
    }
    return ExecutorWhitelistUpdatedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ExecutorWhitelistUpdatedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isExecutorWhitelistUpdatedEvent(data.bcs.type)
      ) {
        throw new Error(
          `object at is not a ExecutorWhitelistUpdatedEvent object`,
        );
      }

      return ExecutorWhitelistUpdatedEvent.fromBcs(
        fromBase64(data.bcs.bcsBytes),
      );
    }
    if (data.content) {
      return ExecutorWhitelistUpdatedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ExecutorWhitelistUpdatedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isExecutorWhitelistUpdatedEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a ExecutorWhitelistUpdatedEvent object`,
      );
    }

    return ExecutorWhitelistUpdatedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== ExecutorAddedEvent =============================== */

export function isExecutorAddedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ExecutorAddedEvent")}::config::ExecutorAddedEvent`
  );
}

export interface ExecutorAddedEventFields {
  configId: ToField<ID>;
  executor: ToField<"address">;
}

export type ExecutorAddedEventReified = Reified<
  ExecutorAddedEvent,
  ExecutorAddedEventFields
>;

export type ExecutorAddedEventJSONField = {
  configId: string;
  executor: string;
};

export type ExecutorAddedEventJSON = {
  $typeName: typeof ExecutorAddedEvent.$typeName;
  $typeArgs: [];
} & ExecutorAddedEventJSONField;

export class ExecutorAddedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ExecutorAddedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ExecutorAddedEvent",
    )}::config::ExecutorAddedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ExecutorAddedEvent.$typeName =
    ExecutorAddedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ExecutorAddedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ExecutorAddedEvent.$isPhantom =
    ExecutorAddedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly executor: ToField<"address">;

  private constructor(typeArgs: [], fields: ExecutorAddedEventFields) {
    this.$fullTypeName = composeSuiType(
      ExecutorAddedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ExecutorAddedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.executor = fields.executor;
  }

  static reified(): ExecutorAddedEventReified {
    const reifiedBcs = ExecutorAddedEvent.bcs;
    return {
      typeName: ExecutorAddedEvent.$typeName,
      fullTypeName: composeSuiType(
        ExecutorAddedEvent.$typeName,
        ...[],
      ) as `${string}::config::ExecutorAddedEvent`,
      typeArgs: [] as [],
      isPhantom: ExecutorAddedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ExecutorAddedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ExecutorAddedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ExecutorAddedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ExecutorAddedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ExecutorAddedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ExecutorAddedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ExecutorAddedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ExecutorAddedEvent.fetch(client, id),
      new: (fields: ExecutorAddedEventFields) => {
        return new ExecutorAddedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ExecutorAddedEventReified {
    return ExecutorAddedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ExecutorAddedEvent>> {
    return phantom(ExecutorAddedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ExecutorAddedEvent>> {
    return ExecutorAddedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ExecutorAddedEvent", {
      config_id: ID.bcs,
      executor: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ExecutorAddedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ExecutorAddedEvent.instantiateBcs> {
    if (!ExecutorAddedEvent.cachedBcs) {
      ExecutorAddedEvent.cachedBcs = ExecutorAddedEvent.instantiateBcs();
    }
    return ExecutorAddedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ExecutorAddedEvent {
    return ExecutorAddedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      executor: decodeFromFields("address", fields.executor),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ExecutorAddedEvent {
    if (!isExecutorAddedEvent(item.type)) {
      throw new Error("not a ExecutorAddedEvent type");
    }

    return ExecutorAddedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      executor: decodeFromFieldsWithTypes("address", item.fields.executor),
    });
  }

  static fromBcs(data: Uint8Array): ExecutorAddedEvent {
    return ExecutorAddedEvent.fromFields(ExecutorAddedEvent.bcs.parse(data));
  }

  toJSONField(): ExecutorAddedEventJSONField {
    return {
      configId: this.configId,
      executor: this.executor,
    };
  }

  toJSON(): ExecutorAddedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ExecutorAddedEvent {
    return ExecutorAddedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      executor: decodeFromJSONField("address", field.executor),
    });
  }

  static fromJSON(json: Record<string, any>): ExecutorAddedEvent {
    if (json.$typeName !== ExecutorAddedEvent.$typeName) {
      throw new Error(
        `not a ExecutorAddedEvent json object: expected '${ExecutorAddedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ExecutorAddedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ExecutorAddedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isExecutorAddedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ExecutorAddedEvent object`,
      );
    }
    return ExecutorAddedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ExecutorAddedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isExecutorAddedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a ExecutorAddedEvent object`);
      }

      return ExecutorAddedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ExecutorAddedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ExecutorAddedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isExecutorAddedEvent(res.type)) {
      throw new Error(`object at id ${id} is not a ExecutorAddedEvent object`);
    }

    return ExecutorAddedEvent.fromBcs(res.bcsBytes);
  }
}

/* ============================== ExecutorRemovedEvent =============================== */

export function isExecutorRemovedEvent(type: string): boolean {
  type = compressSuiType(type);
  return (
    type ===
    `${getTypeOrigin("dca", "config::ExecutorRemovedEvent")}::config::ExecutorRemovedEvent`
  );
}

export interface ExecutorRemovedEventFields {
  configId: ToField<ID>;
  executor: ToField<"address">;
}

export type ExecutorRemovedEventReified = Reified<
  ExecutorRemovedEvent,
  ExecutorRemovedEventFields
>;

export type ExecutorRemovedEventJSONField = {
  configId: string;
  executor: string;
};

export type ExecutorRemovedEventJSON = {
  $typeName: typeof ExecutorRemovedEvent.$typeName;
  $typeArgs: [];
} & ExecutorRemovedEventJSONField;

export class ExecutorRemovedEvent implements StructClass {
  __StructClass = true as const;

  static readonly $typeName: `${string}::config::ExecutorRemovedEvent` =
    `${getTypeOrigin(
      "dca",
      "config::ExecutorRemovedEvent",
    )}::config::ExecutorRemovedEvent` as const;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName: typeof ExecutorRemovedEvent.$typeName =
    ExecutorRemovedEvent.$typeName;
  readonly $fullTypeName: `${string}::config::ExecutorRemovedEvent`;
  readonly $typeArgs: [];
  readonly $isPhantom: typeof ExecutorRemovedEvent.$isPhantom =
    ExecutorRemovedEvent.$isPhantom;

  readonly configId: ToField<ID>;
  readonly executor: ToField<"address">;

  private constructor(typeArgs: [], fields: ExecutorRemovedEventFields) {
    this.$fullTypeName = composeSuiType(
      ExecutorRemovedEvent.$typeName,
      ...typeArgs,
    ) as `${string}::config::ExecutorRemovedEvent`;
    this.$typeArgs = typeArgs;

    this.configId = fields.configId;
    this.executor = fields.executor;
  }

  static reified(): ExecutorRemovedEventReified {
    const reifiedBcs = ExecutorRemovedEvent.bcs;
    return {
      typeName: ExecutorRemovedEvent.$typeName,
      fullTypeName: composeSuiType(
        ExecutorRemovedEvent.$typeName,
        ...[],
      ) as `${string}::config::ExecutorRemovedEvent`,
      typeArgs: [] as [],
      isPhantom: ExecutorRemovedEvent.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        ExecutorRemovedEvent.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        ExecutorRemovedEvent.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) =>
        ExecutorRemovedEvent.fromFields(reifiedBcs.parse(data)),
      bcs: reifiedBcs,
      fromJSONField: (field: any) => ExecutorRemovedEvent.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        ExecutorRemovedEvent.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        ExecutorRemovedEvent.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        ExecutorRemovedEvent.fromSuiObjectData(content),
      fetch: async (client: SupportedSuiClient, id: string) =>
        ExecutorRemovedEvent.fetch(client, id),
      new: (fields: ExecutorRemovedEventFields) => {
        return new ExecutorRemovedEvent([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r(): ExecutorRemovedEventReified {
    return ExecutorRemovedEvent.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<ExecutorRemovedEvent>> {
    return phantom(ExecutorRemovedEvent.reified());
  }

  static get p(): PhantomReified<ToTypeStr<ExecutorRemovedEvent>> {
    return ExecutorRemovedEvent.phantom();
  }

  private static instantiateBcs() {
    return bcs.struct("ExecutorRemovedEvent", {
      config_id: ID.bcs,
      executor: bcs.bytes(32).transform({
        input: (val: string) => fromHex(val),
        output: (val: Uint8Array) => toHex(val),
      }),
    });
  }

  private static cachedBcs: ReturnType<
    typeof ExecutorRemovedEvent.instantiateBcs
  > | null = null;

  static get bcs(): ReturnType<typeof ExecutorRemovedEvent.instantiateBcs> {
    if (!ExecutorRemovedEvent.cachedBcs) {
      ExecutorRemovedEvent.cachedBcs = ExecutorRemovedEvent.instantiateBcs();
    }
    return ExecutorRemovedEvent.cachedBcs;
  }

  static fromFields(fields: Record<string, any>): ExecutorRemovedEvent {
    return ExecutorRemovedEvent.reified().new({
      configId: decodeFromFields(ID.reified(), fields.config_id),
      executor: decodeFromFields("address", fields.executor),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): ExecutorRemovedEvent {
    if (!isExecutorRemovedEvent(item.type)) {
      throw new Error("not a ExecutorRemovedEvent type");
    }

    return ExecutorRemovedEvent.reified().new({
      configId: decodeFromFieldsWithTypes(ID.reified(), item.fields.config_id),
      executor: decodeFromFieldsWithTypes("address", item.fields.executor),
    });
  }

  static fromBcs(data: Uint8Array): ExecutorRemovedEvent {
    return ExecutorRemovedEvent.fromFields(
      ExecutorRemovedEvent.bcs.parse(data),
    );
  }

  toJSONField(): ExecutorRemovedEventJSONField {
    return {
      configId: this.configId,
      executor: this.executor,
    };
  }

  toJSON(): ExecutorRemovedEventJSON {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): ExecutorRemovedEvent {
    return ExecutorRemovedEvent.reified().new({
      configId: decodeFromJSONField(ID.reified(), field.configId),
      executor: decodeFromJSONField("address", field.executor),
    });
  }

  static fromJSON(json: Record<string, any>): ExecutorRemovedEvent {
    if (json.$typeName !== ExecutorRemovedEvent.$typeName) {
      throw new Error(
        `not a ExecutorRemovedEvent json object: expected '${ExecutorRemovedEvent.$typeName}' but got '${json.$typeName}'`,
      );
    }

    return ExecutorRemovedEvent.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): ExecutorRemovedEvent {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isExecutorRemovedEvent(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a ExecutorRemovedEvent object`,
      );
    }
    return ExecutorRemovedEvent.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): ExecutorRemovedEvent {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isExecutorRemovedEvent(data.bcs.type)
      ) {
        throw new Error(`object at is not a ExecutorRemovedEvent object`);
      }

      return ExecutorRemovedEvent.fromBcs(fromBase64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return ExecutorRemovedEvent.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SupportedSuiClient,
    id: string,
  ): Promise<ExecutorRemovedEvent> {
    const res = await fetchObjectBcs(client, id);
    if (!isExecutorRemovedEvent(res.type)) {
      throw new Error(
        `object at id ${id} is not a ExecutorRemovedEvent object`,
      );
    }

    return ExecutorRemovedEvent.fromBcs(res.bcsBytes);
  }
}
