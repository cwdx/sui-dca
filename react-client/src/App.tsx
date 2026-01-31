import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Calculator, ExternalLink, Activity, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Route, Router, Switch, useLocation } from "wouter";
import { AccountMenu } from "@/components/AccountMenu";
import { Admin } from "@/components/Admin";
import { CreateDCA } from "@/components/CreateDCA";
import { DCACalculator } from "@/components/DCACalculator";
import { MyDCAs } from "@/components/MyDCAs";
import { Toaster } from "@/components/Toaster";
import { Button } from "@/components/ui";
import { useDCAEventSubscription } from "@/hooks/useDCAEvents";
import { useExecutorHealth } from "@/hooks/useExecutorHealth";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <img src={`${import.meta.env.BASE_URL}sui.svg`} alt="Sui" className="w-7 h-7 md:w-8 md:h-8" />
            <span className="text-lg md:text-h4 font-serif text-foreground-primary">
              Sui DCA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/calculator">Calculator</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {account ? <AccountMenu /> : <ConnectButton />}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border px-4 py-2 flex flex-col gap-1 bg-background-secondary">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/calculator">Calculator</NavLink>
          <NavLink href="/admin">Admin</NavLink>
        </nav>
      )}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 sm:mt-20 text-left">
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

function Footer() {
  const { data: health, isLoading, isError } = useExecutorHealth();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm">
          {/* Links */}
          <div className="flex items-center gap-4 text-foreground-muted">
            <span>Powered by</span>
            <a
              href="https://sui.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              Sui
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>&bull;</span>
            <a
              href="https://pyth.network"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              Pyth Network
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Executor Status */}
          <div className="flex items-center gap-3 text-foreground-muted">
            <Activity className="w-4 h-4" />
            <span>Executor:</span>
            {isLoading ? (
              <span className="text-foreground-tertiary">Checking...</span>
            ) : isError ? (
              <span className="text-status-error">Offline</span>
            ) : health ? (
              <div className="flex items-center gap-2">
                <span className="text-status-success">Online</span>
                <span className="text-foreground-tertiary">|</span>
                <Wallet className="w-3 h-3" />
                <span className="font-mono text-xs">{health.executor.balance}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const account = useCurrentAccount();

  // Subscribe to live DCA events for toasts and query invalidation
  useDCAEventSubscription();

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />
      <Toaster />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/calculator" component={CalculatorPage} />
          <Route path="/admin" component={AdminPage} />
        </Switch>
      </main>

      <Footer />
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
