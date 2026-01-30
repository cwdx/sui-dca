import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Calculator } from "lucide-react";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { AccountMenu } from "@/components/AccountMenu";
import { Admin } from "@/components/Admin";
import { CreateDCA } from "@/components/CreateDCA";
import { DCACalculator } from "@/components/DCACalculator";
import { MyDCAs } from "@/components/MyDCAs";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// Get base path from Vite (for GitHub Pages deployment)
const BASE_PATH = import.meta.env.BASE_URL || "/";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const isActive =
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(isActive && "bg-background-tertiary")}
      >
        {children}
      </Button>
    </Link>
  );
}

function Header() {
  const account = useCurrentAccount();

  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/sui.svg" alt="Sui" className="w-8 h-8" />
            <span className="text-h4 font-serif text-foreground-primary">
              Sui DCA
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {account && (
              <>
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/calculator">Calculator</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </>
            )}
            {!account && <NavLink href="/calculator">Calculator</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {account ? <AccountMenu /> : <ConnectButton />}
        </div>
      </div>
    </header>
  );
}

function Landing() {
  return (
    <div className="text-center py-20 max-w-2xl mx-auto">
      <p className="overline mb-4">Automated Investing on Sui</p>
      <h1 className="text-display font-serif text-foreground-primary mb-6">
        Dollar Cost Averaging,
        <br />
        Made Simple
      </h1>
      <p className="text-body-lg text-foreground-secondary mb-10 max-w-lg mx-auto">
        Automate your crypto investments with trustless, oracle-powered DCA
        strategies on Sui blockchain.
      </p>
      <div className="flex gap-4 justify-center">
        <ConnectButton />
        <Link href="/calculator">
          <Button variant="secondary" className="gap-2">
            <Calculator className="w-4 h-4" />
            Try Calculator
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-8 mt-20 text-left">
        <div>
          <h3 className="text-h4 font-serif mb-2">Oracle-Powered</h3>
          <p className="text-foreground-secondary text-sm">
            Pyth Network oracles ensure fair pricing on every trade with
            slippage protection.
          </p>
        </div>
        <div>
          <h3 className="text-h4 font-serif mb-2">Fully Automated</h3>
          <p className="text-foreground-secondary text-sm">
            Set your schedule and forget. Permissionless executors trigger your
            trades on time.
          </p>
        </div>
        <div>
          <h3 className="text-h4 font-serif mb-2">Non-Custodial</h3>
          <p className="text-foreground-secondary text-sm">
            Your funds stay in your DCA account. Cancel anytime and withdraw
            instantly.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="grid lg:grid-cols-2 gap-12">
      <div>
        <p className="overline mb-2">New Strategy</p>
        <h2 className="text-h2 font-serif text-foreground-primary mb-6">
          Create DCA
        </h2>
        <CreateDCA />
      </div>

      <div>
        <p className="overline mb-2">Your Strategies</p>
        <h2 className="text-h2 font-serif text-foreground-primary mb-6">
          Active DCAs
        </h2>
        <MyDCAs />
      </div>
    </div>
  );
}

function CalculatorPage() {
  return <DCACalculator />;
}

function AdminPage() {
  return (
    <div className="max-w-4xl">
      <p className="overline mb-2">Protocol Management</p>
      <h2 className="text-h2 font-serif text-foreground-primary mb-6">
        Admin Panel
      </h2>
      <Admin />
    </div>
  );
}

function AppContent() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <Switch>
          {/* Calculator is always accessible */}
          <Route path="/calculator" component={CalculatorPage} />

          {/* These routes require wallet connection */}
          {account ? (
            <>
              <Route path="/" component={Dashboard} />
              <Route path="/admin" component={AdminPage} />
            </>
          ) : (
            <Route path="/" component={Landing} />
          )}
        </Switch>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-foreground-muted text-body-sm">
          Powered by Sui blockchain &bull; Oracle pricing by Pyth Network
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  // Strip trailing slash from base path for wouter
  const base = BASE_PATH.endsWith("/") ? BASE_PATH.slice(0, -1) : BASE_PATH;

  return (
    <Router base={base || undefined}>
      <AppContent />
    </Router>
  );
}
