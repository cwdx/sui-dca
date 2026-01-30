# Sui DCA React Client

React frontend for the Sui DCA (Dollar Cost Averaging) protocol.

## Features

- Create DCA strategies with customizable schedules
- Manage active DCAs (pause, resume, cancel)
- Admin panel for protocol configuration
- Multi-wallet support via Mysten dApp Kit

## Tech Stack

Vite, React 18, TypeScript, Tailwind CSS, Radix UI, TanStack Query, wouter, dayjs

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
```

## Project Structure

```
src/
├── _generated/          # Contract bindings (sui-client-gen)
├── components/
│   ├── ui/              # Design system components
│   ├── AccountMenu.tsx  # Wallet dropdown
│   ├── Admin.tsx        # Protocol admin panel
│   ├── CreateDCA.tsx    # DCA creation form
│   └── MyDCAs.tsx       # Active DCA list
├── config/
│   ├── contracts.ts     # Contract addresses
│   └── tokens.ts        # Supported tokens
├── lib/utils.ts         # Utilities (cn)
├── App.tsx              # Routing
├── main.tsx             # Providers
└── index.css            # Design tokens
```

## Design System

See **[DESIGN.md](./DESIGN.md)** for typography, colors, components, and usage guidelines.

## Configuration

**Network**: Change `defaultNetwork` in `src/main.tsx`

**Contracts**: Update addresses in `src/config/contracts.ts`

**Tokens**: Add tokens in `src/config/tokens.ts`

## Regenerate Contract Bindings

```bash
cd ../packages/dca
sui-client-gen --manifest Move.toml --out ../react-client/src/_generated
```

## License

MIT
