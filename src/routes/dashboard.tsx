import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useBless } from "@/hooks/use-bless";
import { AppShell } from "@/components/bless/AppShell";
import { RateSpark } from "@/components/bless/RateSpark";
import { LivePulse } from "@/components/bless/LivePulse";
import { fmtINR, holdingsValue, pnl, totalPortfolio } from "@/lib/bless-store";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Sparkles, FastForward, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Vault · Bless Investments" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("bless.state.v1");
      if (!raw) throw redirect({ to: "/auth" });
      const s = JSON.parse(raw);
      if (!s.user) throw redirect({ to: "/auth" });
    } catch (e) {
      // redirect throws aren't real errors — rethrow
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const { state, doSkip, reset } = useBless();
  const [skipping, setSkipping] = useState(false);
  const total = totalPortfolio(state);
  const v = holdingsValue(state);
  const gPnl = pnl(state, "gold");
  const sPnl = pnl(state, "silver");
  const invested = v.gold + v.silver;
  const totalPnl = gPnl.abs + sPnl.abs;

  const skip = (d: number) => {
    setSkipping(true);
    setTimeout(() => {
      doSkip(d);
      setSkipping(false);
      toast.success(`Skipped ${d} day${d > 1 ? "s" : ""}`, {
        description: `Your investment matured after ${d} day${d > 1 ? "s" : ""}. Rates refreshed.`,
      });
    }, 350);
  };

  return (
    <AppShell>
      {/* Hero / portfolio total */}
      <section className="relative overflow-hidden rounded-3xl surface p-6 sm:p-8 grain">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Total Vault Value
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-2">
              <span className="text-gold-grad">{fmtINR(total)}</span>
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span
                className={
                  totalPnl >= 0 ? "text-success font-medium" : "text-destructive font-medium"
                }
              >
                {totalPnl >= 0 ? "▲" : "▼"} {fmtINR(Math.abs(totalPnl))}
              </span>
              <span className="text-muted-foreground">
                across {invested > 0 ? fmtINR(invested) : "no"} bullion holdings
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto">
            {[1, 7, 30].map((d) => (
              <Button
                key={d}
                onClick={() => skip(d)}
                disabled={skipping}
                variant="secondary"
                className="bg-secondary/60 border border-border/60 hover:bg-accent hover:border-primary/40"
              >
                <FastForward className="h-3.5 w-3.5 mr-1.5" />
                Skip {d}d
              </Button>
            ))}
            <Button
              onClick={() => {
                if (confirm("Reset the vault to its starting state?")) {
                  reset();
                  toast.message("Vault reset");
                }
              }}
              variant="ghost"
              className="col-span-2 sm:col-span-3 text-muted-foreground hover:text-foreground text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" /> Reset simulation
            </Button>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <Stat label="Cash wallet" value={fmtINR(state.wallet)} />
          <Stat label="Gold holdings" value={`${state.holdings.gold.toFixed(4)} g`} sub={fmtINR(v.gold)} />
          <Stat label="Silver holdings" value={`${state.holdings.silver.toFixed(4)} g`} sub={fmtINR(v.silver)} />
        </div>
      </section>

      {/* Live rates */}
      <section className="mt-6 grid lg:grid-cols-2 gap-4">
        <MetalCard
          metal="gold"
          name="Gold"
          rate={state.rates.gold}
          history={state.rateHistory}
          holdings={state.holdings.gold}
          avg={state.avgBuy.gold}
          pnlData={gPnl}
        />
        <MetalCard
          metal="silver"
          name="Silver"
          rate={state.rates.silver}
          history={state.rateHistory}
          holdings={state.holdings.silver}
          avg={state.avgBuy.silver}
          pnlData={sPnl}
        />
      </section>

      {/* Maturity note */}
      {state.day > 0 && (
        <section className="mt-6 surface rounded-2xl p-5 flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm">
              <span className="text-foreground font-medium">
                Your investment matured after {state.day} simulated day{state.day > 1 ? "s" : ""}.
              </span>{" "}
              <span className="text-muted-foreground">
                {totalPnl >= 0
                  ? `You're up ${fmtINR(totalPnl)} on bullion — patience is paying.`
                  : `You're down ${fmtINR(Math.abs(totalPnl))} on bullion. Markets breathe both ways.`}
              </span>
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 flex flex-wrap gap-3">
        <Link to="/trade" className="flex-1">
          <Button className="w-full h-12 bg-[image:var(--gradient-gold)] text-primary-foreground hover:opacity-95">
            Buy / sell bullion
          </Button>
        </Link>
        <Link to="/history" className="flex-1">
          <Button variant="secondary" className="w-full h-12 border border-border/60">
            View ledger
          </Button>
        </Link>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold mt-1.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function MetalCard({
  metal,
  name,
  rate,
  history,
  holdings,
  avg,
  pnlData,
}: {
  metal: "gold" | "silver";
  name: string;
  rate: number;
  history: { day: number; gold: number; silver: number }[];
  holdings: number;
  avg: number;
  pnlData: { abs: number; pct: number };
}) {
  const up = pnlData.abs >= 0;
  return (
    <article className="surface rounded-3xl p-6 relative overflow-hidden">
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full animate-tick"
              style={{
                background: metal === "gold" ? "var(--color-gold)" : "var(--color-silver)",
              }}
            />
            <span className="font-display text-lg font-semibold">{name}</span>
            <LivePulse />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Spot rate per gram</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold">{fmtINR(rate)}</p>
          {holdings > 0 && (
            <p className={`text-xs mt-0.5 ${up ? "text-success" : "text-destructive"}`}>
              {up ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
              {" "}{pnlData.pct.toFixed(2)}%
            </p>
          )}
        </div>
      </header>

      <div className="mt-4">
        <RateSpark data={history} metal={metal} height={70} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Holdings</p>
          <p className="text-foreground font-medium mt-0.5">{holdings.toFixed(4)} g</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg buy</p>
          <p className="text-foreground font-medium mt-0.5">{avg > 0 ? fmtINR(avg) : "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">P/L</p>
          <p className={`font-medium mt-0.5 ${up ? "text-success" : "text-destructive"}`}>
            {holdings > 0 ? `${up ? "+" : "−"}${fmtINR(Math.abs(pnlData.abs))}` : "—"}
          </p>
        </div>
      </div>
    </article>
  );
}
