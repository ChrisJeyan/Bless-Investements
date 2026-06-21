import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useBless } from "@/hooks/use-bless";
import { AppShell } from "@/components/bless/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtINR } from "@/lib/bless-store";
import { toast } from "sonner";

export const Route = createFileRoute("/trade")({
  head: () => ({ meta: [{ title: "Trade · Bless Investments" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("bless.state.v1");
      if (!raw || !JSON.parse(raw).user) throw redirect({ to: "/auth" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
    }
  },
  component: TradePage,
});

const QUICK = [500, 1000, 5000, 10000];

function TradePage() {
  const { state, doBuy, doSell } = useBless();
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<string>("1000");
  const [grams, setGrams] = useState<string>("0.1");

  const price = state.rates[metal];
  const holdings = state.holdings[metal];

  const onBuy = () => {
    const inr = parseFloat(amount);
    if (!inr || inr <= 0) return toast.error("Enter an amount");
    if (inr > state.wallet) return toast.error("Insufficient wallet balance");
    doBuy(metal, inr);
    toast.success(`Bought ${(inr / price).toFixed(4)} g of ${metal}`, {
      description: `at ${fmtINR(price)}/g`,
    });
  };

  const onSell = () => {
    const g = parseFloat(grams);
    if (!g || g <= 0) return toast.error("Enter grams to sell");
    if (g > holdings) return toast.error("Not enough holdings");
    doSell(metal, g);
    toast.success(`Sold ${g.toFixed(4)} g of ${metal}`, {
      description: `for ${fmtINR(g * price)}`,
    });
  };

  return (
    <AppShell>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order desk</p>
        <h1 className="font-display text-3xl font-semibold mt-1">Trade bullion</h1>
      </header>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
        {/* Order card */}
        <section className="surface rounded-3xl p-6">
          {/* Metal toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-background/40 border border-border/60 mb-5">
            {(["gold", "silver"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetal(m)}
                className={`relative h-11 rounded-xl text-sm font-medium capitalize transition-all ${
                  metal === m
                    ? "bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m} · {fmtINR(state.rates[m])}/g
              </button>
            ))}
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "buy" | "sell")}>
            <TabsList className="grid w-full grid-cols-2 bg-background/40 border border-border/60">
              <TabsTrigger value="buy" className="data-[state=active]:bg-success/15 data-[state=active]:text-success">
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive">
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Amount to invest
                </label>
                <div className="flex items-stretch rounded-xl border border-border/60 bg-input/60 focus-within:border-primary/60">
                  <span className="px-4 grid place-items-center text-sm text-muted-foreground border-r border-border/60">
                    ₹
                  </span>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    className="h-14 border-0 bg-transparent text-2xl font-display font-semibold focus-visible:ring-0"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
                    >
                      {fmtINR(q)}
                    </button>
                  ))}
                </div>
              </div>

              <Summary
                rows={[
                  ["You'll get", `${(parseFloat(amount || "0") / price || 0).toFixed(4)} g`],
                  ["Rate", `${fmtINR(price)}/g`],
                  ["Wallet after", fmtINR(Math.max(0, state.wallet - (parseFloat(amount) || 0)))],
                ]}
              />

              <Button
                onClick={onBuy}
                className="w-full h-12 bg-[image:var(--gradient-gold)] text-primary-foreground hover:opacity-95"
              >
                Buy {metal}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Grams to sell
                </label>
                <div className="flex items-stretch rounded-xl border border-border/60 bg-input/60 focus-within:border-primary/60">
                  <Input
                    value={grams}
                    onChange={(e) => setGrams(e.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    className="h-14 border-0 bg-transparent text-2xl font-display font-semibold focus-visible:ring-0"
                  />
                  <span className="px-4 grid place-items-center text-sm text-muted-foreground border-l border-border/60">
                    g
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[0.25, 0.5, 1].map((f) => (
                    <button
                      key={f}
                      onClick={() => setGrams((holdings * f).toFixed(4))}
                      className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
                      disabled={holdings <= 0}
                    >
                      {f === 1 ? "Max" : `${f * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <Summary
                rows={[
                  ["You'll receive", fmtINR((parseFloat(grams) || 0) * price)],
                  ["Rate", `${fmtINR(price)}/g`],
                  ["Holdings after", `${Math.max(0, holdings - (parseFloat(grams) || 0)).toFixed(4)} g`],
                ]}
              />

              <Button
                onClick={onSell}
                disabled={holdings <= 0}
                variant="destructive"
                className="w-full h-12"
              >
                Sell {metal}
              </Button>
            </TabsContent>
          </Tabs>
        </section>

        {/* Side panel — context */}
        <aside className="space-y-4">
          <div className="surface rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Wallet</p>
            <p className="font-display text-3xl font-semibold mt-1.5 text-gold-grad">
              {fmtINR(state.wallet)}
            </p>
          </div>
          <div className="surface rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground capitalize">
              Your {metal}
            </p>
            <p className="font-display text-2xl font-semibold mt-1.5">
              {holdings.toFixed(4)} g
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Value: {fmtINR(holdings * price)} · Avg buy:{" "}
              {state.avgBuy[metal] > 0 ? fmtINR(state.avgBuy[metal]) : "—"}
            </p>
          </div>
          <div className="surface rounded-3xl p-6 text-xs text-muted-foreground leading-relaxed">
            <p className="text-foreground font-medium mb-1">A gentle reminder</p>
            Rates here drift on a random walk for simulation. Use the time-skip on the Vault to
            jump days forward and see how patience or panic plays out.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-4 space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}
