import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useBless } from "@/hooks/use-bless";
import { AppShell } from "@/components/bless/AppShell";
import { fmtINR } from "@/lib/bless-store";
import { ArrowDownLeft, ArrowUpRight, Wallet, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Ledger · Bless Investments" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("bless.state.v1");
      if (!raw || !JSON.parse(raw).user) throw redirect({ to: "/auth" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
    }
  },
  component: HistoryPage,
});

function HistoryPage() {
  const { state } = useBless();
  const txs = state.transactions;

  return (
    <AppShell>
      <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ledger</p>
          <h1 className="font-display text-3xl font-semibold mt-1">Transaction history</h1>
        </div>
        <p className="text-sm text-muted-foreground">{txs.length} entries</p>
      </header>

      {txs.length === 0 ? (
        <div className="surface rounded-3xl p-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
          <Link to="/trade">
            <Button className="mt-4 bg-[image:var(--gradient-gold)] text-primary-foreground">
              Make your first trade
            </Button>
          </Link>
        </div>
      ) : (
        <ol className="surface rounded-3xl divide-y divide-border/60 overflow-hidden">
          {txs.map((t) => (
            <li key={t.id} className="flex items-center gap-4 p-4 sm:p-5">
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${
                  t.type === "buy"
                    ? "bg-success/15 text-success"
                    : t.type === "sell"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary"
                }`}
              >
                {t.type === "buy" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : t.type === "sell" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">
                  {t.type === "deposit"
                    ? "Wallet credited"
                    : `${t.type} ${t.metal} · ${t.grams?.toFixed(4)} g`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Day {t.day} ·{" "}
                  {new Date(t.timestamp).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {t.pricePerGram ? ` · @ ${fmtINR(t.pricePerGram)}/g` : ""}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    t.type === "buy" ? "text-foreground" : t.type === "sell" ? "text-success" : "text-primary"
                  }`}
                >
                  {t.type === "buy" ? "−" : "+"}
                  {fmtINR(t.amountInr)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
