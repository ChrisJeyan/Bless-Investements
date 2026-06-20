// Bless Investments — client-side simulation store (localStorage).
// Fake money, fake metals, mock pricing engine.

export type Metal = "gold" | "silver";

export type Transaction = {
  id: string;
  type: "buy" | "sell" | "deposit";
  metal?: Metal;
  grams?: number;
  pricePerGram?: number;
  amountInr: number;
  day: number;
  timestamp: number;
};

export type RatePoint = { day: number; gold: number; silver: number };

export type BlessState = {
  user: { phone: string; name: string } | null;
  wallet: number; // INR
  holdings: { gold: number; silver: number }; // grams
  avgBuy: { gold: number; silver: number }; // weighted avg INR/g
  rates: { gold: number; silver: number };
  rateHistory: RatePoint[];
  transactions: Transaction[];
  day: number;
};

const KEY = "bless.state.v1";
const STARTING_WALLET = 100_000;
const BASE_RATES = { gold: 7250, silver: 95 };

function seedHistory(): RatePoint[] {
  // 30 days of synthetic history ending today
  const pts: RatePoint[] = [];
  let g = BASE_RATES.gold * 0.94;
  let s = BASE_RATES.silver * 0.92;
  for (let d = -30; d <= 0; d++) {
    g = g * (1 + (Math.random() - 0.45) * 0.012);
    s = s * (1 + (Math.random() - 0.45) * 0.02);
    pts.push({ day: d, gold: Math.round(g * 100) / 100, silver: Math.round(s * 100) / 100 });
  }
  // pin the last point to BASE rates
  pts[pts.length - 1] = { day: 0, gold: BASE_RATES.gold, silver: BASE_RATES.silver };
  return pts;
}

export function initialState(): BlessState {
  return {
    user: null,
    wallet: STARTING_WALLET,
    holdings: { gold: 0, silver: 0 },
    avgBuy: { gold: 0, silver: 0 },
    rates: { ...BASE_RATES },
    rateHistory: seedHistory(),
    transactions: [
      {
        id: crypto.randomUUID(),
        type: "deposit",
        amountInr: STARTING_WALLET,
        day: 0,
        timestamp: Date.now(),
      },
    ],
    day: 0,
  };
}

export function loadState(): BlessState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return JSON.parse(raw) as BlessState;
  } catch {
    return initialState();
  }
}

export function saveState(s: BlessState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetState() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

// --- Pricing engine (mock random walk) -------------------------------------
export function stepRates(rates: { gold: number; silver: number }) {
  const gDrift = (Math.random() - 0.48) * 0.014; // slight upward bias
  const sDrift = (Math.random() - 0.48) * 0.022;
  return {
    gold: Math.max(1, Math.round(rates.gold * (1 + gDrift) * 100) / 100),
    silver: Math.max(1, Math.round(rates.silver * (1 + sDrift) * 100) / 100),
  };
}

// --- Domain actions --------------------------------------------------------
export function buy(state: BlessState, metal: Metal, amountInr: number): BlessState {
  if (amountInr <= 0 || amountInr > state.wallet) return state;
  const price = state.rates[metal];
  const grams = amountInr / price;
  const prevGrams = state.holdings[metal];
  const prevAvg = state.avgBuy[metal];
  const newGrams = prevGrams + grams;
  const newAvg = newGrams > 0 ? (prevAvg * prevGrams + price * grams) / newGrams : 0;
  return {
    ...state,
    wallet: Math.round((state.wallet - amountInr) * 100) / 100,
    holdings: { ...state.holdings, [metal]: Math.round(newGrams * 10000) / 10000 },
    avgBuy: { ...state.avgBuy, [metal]: Math.round(newAvg * 100) / 100 },
    transactions: [
      {
        id: crypto.randomUUID(),
        type: "buy",
        metal,
        grams,
        pricePerGram: price,
        amountInr,
        day: state.day,
        timestamp: Date.now(),
      },
      ...state.transactions,
    ],
  };
}

export function sell(state: BlessState, metal: Metal, grams: number): BlessState {
  if (grams <= 0 || grams > state.holdings[metal]) return state;
  const price = state.rates[metal];
  const amountInr = Math.round(grams * price * 100) / 100;
  const newGrams = state.holdings[metal] - grams;
  return {
    ...state,
    wallet: Math.round((state.wallet + amountInr) * 100) / 100,
    holdings: { ...state.holdings, [metal]: Math.round(newGrams * 10000) / 10000 },
    avgBuy: {
      ...state.avgBuy,
      [metal]: newGrams <= 0.0001 ? 0 : state.avgBuy[metal],
    },
    transactions: [
      {
        id: crypto.randomUUID(),
        type: "sell",
        metal,
        grams,
        pricePerGram: price,
        amountInr,
        day: state.day,
        timestamp: Date.now(),
      },
      ...state.transactions,
    ],
  };
}

export function skipDays(state: BlessState, days: number): BlessState {
  let rates = state.rates;
  const history = [...state.rateHistory];
  let day = state.day;
  for (let i = 0; i < days; i++) {
    rates = stepRates(rates);
    day += 1;
    history.push({ day, gold: rates.gold, silver: rates.silver });
  }
  // keep history bounded
  const trimmed = history.slice(-90);
  return { ...state, rates, rateHistory: trimmed, day };
}

// --- Derived ---------------------------------------------------------------
export function holdingsValue(state: BlessState) {
  return {
    gold: Math.round(state.holdings.gold * state.rates.gold * 100) / 100,
    silver: Math.round(state.holdings.silver * state.rates.silver * 100) / 100,
  };
}

export function pnl(state: BlessState, metal: Metal) {
  const grams = state.holdings[metal];
  if (grams <= 0) return { abs: 0, pct: 0 };
  const cost = grams * state.avgBuy[metal];
  const value = grams * state.rates[metal];
  const abs = Math.round((value - cost) * 100) / 100;
  const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
  return { abs, pct: Math.round(pct * 100) / 100 };
}

export function totalPortfolio(state: BlessState) {
  const v = holdingsValue(state);
  return Math.round((state.wallet + v.gold + v.silver) * 100) / 100;
}

export const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
