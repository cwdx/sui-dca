import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { ExternalLink, Activity, Wallet, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Redirect, Route, Router, Switch, useLocation } from "wouter";
import { AccountMenu } from "@/components/AccountMenu";
import { Admin } from "@/components/Admin";
import { CreateDCA } from "@/components/CreateDCA";
import { DCACalculator } from "@/components/DCACalculator";
import { Landing } from "@/components/Landing";
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
    <header className="border-b border-border bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}sui.svg`} alt="Sui" className="w-7 h-7 md:w-8 md:h-8" />
            <span className="text-lg md:text-xl font-medium text-foreground-primary">
              Sui DCA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/dca">DCA</NavLink>
            <NavLink href="/calculator">Calculator</NavLink>
            <NavLink href="/protocol">Protocol</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
        <nav className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1 bg-background-primary">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/dca">DCA</NavLink>
          <NavLink href="/calculator">Calculator</NavLink>
          <NavLink href="/protocol">Protocol</NavLink>
        </nav>
      )}
    </header>
  );
}

function LandingPage() {
  return <Landing />;
}

function Dashboard() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div>
        <p className="overline mb-2">New Strategy</p>
        <h2 className="text-h3 sm:text-h2 text-foreground-primary mb-5 sm:mb-6">
          Create DCA
        </h2>
        <CreateDCA />
      </div>

      <div>
        <p className="overline mb-2">Your Strategies</p>
        <h2 className="text-h3 sm:text-h2 text-foreground-primary mb-5 sm:mb-6">
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

function ProtocolPage() {
  return (
    <div className="max-w-4xl">
      <p className="overline mb-2">Protocol Management</p>
      <h2 className="text-h2 text-foreground-primary mb-6">
        Protocol
      </h2>
      <Admin />
    </div>
  );
}

function Footer() {
  const { data: health, isLoading, isError } = useExecutorHealth();

  return (
    <footer className="border-t border-border mt-auto bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Links */}
          <div className="flex items-center gap-4 text-foreground-tertiary">
            <span>Powered by</span>
            <a
              href="https://sui.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground-secondary hover:text-foreground-primary transition-colors"
            >
              Sui
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-foreground-muted">&bull;</span>
            <a
              href="https://pyth.network"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground-secondary hover:text-foreground-primary transition-colors"
            >
              Pyth Network
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Executor Status */}
          <div className="flex items-center gap-2.5 text-foreground-tertiary">
            <Activity className="w-4 h-4" />
            <span>Executor:</span>
            {isLoading ? (
              <span className="text-foreground-muted">Checking...</span>
            ) : isError ? (
              <span className="text-status-error">Offline</span>
            ) : health ? (
              <div className="flex items-center gap-2">
                <span className="text-status-success font-medium">Online</span>
                <span className="text-border-strong">|</span>
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-mono text-xs text-foreground-secondary">{health.executor.balance}</span>
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/dashboard">
            <Redirect to="/" />
          </Route>
          <Route path="/dca" component={Dashboard} />
          <Route path="/calculator" component={CalculatorPage} />
          <Route path="/protocol" component={ProtocolPage} />
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
