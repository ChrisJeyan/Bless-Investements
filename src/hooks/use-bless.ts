import { useCallback, useEffect, useState } from "react";
import {
  type BlessState,
  type Metal,
  buy,
  initialState,
  loadState,
  resetState,
  saveState,
  sell,
  skipDays,
} from "@/lib/bless-store";

let listeners: Array<(s: BlessState) => void> = [];
let current: BlessState | null = null;

function getCurrent(): BlessState {
  if (current) return current;
  current = loadState();
  return current;
}

function set(next: BlessState) {
  current = next;
  saveState(next);
  listeners.forEach((l) => l(next));
}

export function useBless() {
  const [state, setState] = useState<BlessState>(() =>
    typeof window === "undefined" ? initialState() : getCurrent(),
  );

  useEffect(() => {
    // hydrate after mount in case SSR returned defaults
    const s = getCurrent();
    setState(s);
    const fn = (n: BlessState) => setState(n);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  const login = useCallback((phone: string, name: string) => {
    set({ ...getCurrent(), user: { phone, name } });
  }, []);

  const logout = useCallback(() => {
    set({ ...getCurrent(), user: null });
  }, []);

  const doBuy = useCallback((metal: Metal, inr: number) => {
    set(buy(getCurrent(), metal, inr));
  }, []);

  const doSell = useCallback((metal: Metal, grams: number) => {
    set(sell(getCurrent(), metal, grams));
  }, []);

  const doSkip = useCallback((days: number) => {
    set(skipDays(getCurrent(), days));
  }, []);

  const reset = useCallback(() => {
    resetState();
    const fresh = initialState();
    set(fresh);
  }, []);

  return { state, login, logout, doBuy, doSell, doSkip, reset };
}
