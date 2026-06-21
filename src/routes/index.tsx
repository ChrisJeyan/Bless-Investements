import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Always start at auth; the auth page bounces logged-in users to dashboard.
    throw redirect({ to: "/auth" });
  },
});
