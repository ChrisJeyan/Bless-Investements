import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBless } from "@/hooks/use-bless";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Coins, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Bless Investments" },
      { name: "description", content: "Sign in to your Bless Investments vault." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { state, login } = useBless();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (state.user) navigate({ to: "/dashboard" });
  }, [state.user, navigate]);

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    if (!name.trim()) {
      toast.error("Tell us your name");
      return;
    }
    setStep("otp");
    toast.success("OTP sent", { description: "Use 123456 to continue (demo)." });
  };

  const verify = () => {
    if (otp !== "123456") {
      toast.error("Invalid OTP. Hint: 123456");
      return;
    }
    login(phone, name.trim());
    toast.success(`Welcome, ${name.trim()}`);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-aurora)]" />
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] text-primary-foreground shadow-[var(--shadow-glow)]">
            <Coins className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-xl font-semibold">Bless<span className="text-gold-grad"> Investments</span></p>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Digital Bullion Vault</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold">
            A quieter way to <span className="text-gold-grad">hold gold</span>, by the gram.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Simulate buying digital gold and silver, watch your vault breathe with the
            market, and skip time forward to see what patience earns.
          </p>
          <div className="grid gap-3 pt-2">
            {[
              { icon: ShieldCheck, t: "Mock OTP & wallet — zero risk, all feel." },
              { icon: Sparkles, t: "Time-skip to simulate days of market drift." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3 text-sm text-muted-foreground">
                <f.icon className="h-4 w-4 mt-0.5 text-primary" />
                {f.t}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60">
          Prototype · simulated rates · this app does not handle real funds.
        </p>
      </aside>

      {/* Right — form */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--gradient-gold)] text-primary-foreground">
              <Coins className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            <p className="font-display text-lg font-semibold">
              Bless<span className="text-gold-grad"> Investments</span>
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-6">
              <header className="space-y-1.5">
                <h2 className="font-display text-3xl font-semibold">Step inside</h2>
                <p className="text-sm text-muted-foreground">
                  We'll text a one-time code to verify your number.
                </p>
              </header>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Your name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ayesha Khan"
                    maxLength={60}
                    className="h-12 bg-input/60 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile number</label>
                  <div className="flex items-stretch rounded-md border border-border/60 bg-input/60 focus-within:border-primary/60 transition">
                    <span className="px-3 grid place-items-center text-sm text-muted-foreground border-r border-border/60">+91</span>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      inputMode="numeric"
                      className="h-12 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[image:var(--gradient-gold)] text-primary-foreground hover:opacity-95 shadow-[var(--shadow-glow)] font-medium"
              >
                Send OTP
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                By continuing you agree to our demo terms. Nothing here is financial advice.
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <header className="space-y-1.5">
                <h2 className="font-display text-3xl font-semibold">Enter the code</h2>
                <p className="text-sm text-muted-foreground">
                  Sent to <span className="text-foreground">+91 {phone}</span>. Use{" "}
                  <span className="font-mono text-primary">123456</span>.
                </p>
              </header>

              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-11 text-base border-border/60 bg-input/60"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={verify}
                className="w-full h-12 bg-[image:var(--gradient-gold)] text-primary-foreground hover:opacity-95 shadow-[var(--shadow-glow)] font-medium"
              >
                Verify & enter vault
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                ← Use a different number
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
