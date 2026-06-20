import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Coins, LayoutDashboard, ArrowLeftRight, History, LogOut, Sparkles } from "lucide-react";
import { useBless } from "@/hooks/use-bless";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Vault", icon: LayoutDashboard },
  { to: "/trade", label: "Trade", icon: ArrowLeftRight },
  { to: "/history", label: "Ledger", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, logout } = useBless();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 backdrop-blur-xl bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]">
              <Coins className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold tracking-tight">
                Bless<span className="text-gold-grad"> Investments</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Digital Bullion · Day {state.day}
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-[image:var(--gradient-gold)] text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <n.icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-xs text-muted-foreground">Investor</span>
              <span className="text-sm font-medium">{state.user?.name ?? "Guest"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 rounded-2xl surface px-2 py-2 flex justify-around">
        {NAV.map((n) => {
          const active = pathname === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="h-4.5 w-4.5" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <footer className="hidden sm:flex items-center justify-center gap-1.5 pb-6 text-[11px] text-muted-foreground/70">
        <Sparkles className="h-3 w-3" />
        Prototype · simulated rates · no real money
      </footer>
    </div>
  );
}
