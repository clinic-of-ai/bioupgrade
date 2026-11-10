import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
const state = vi.hoisted(() => ({ authenticated: false, error: false }));
vi.mock("../client/src/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: state.authenticated,
    user: state.authenticated ? { id: 1 } : null,
  }),
}));
vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    rewards: {
      me: {
        useQuery: () => ({
          data: { account: { pointsBalance: 999999 } },
          isError: state.error,
        }),
      },
    },
    checkout: {
      createSession: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    interest: {
      join: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));
import Shop from "../client/src/pages/Shop";
const markup = () =>
  renderToStaticMarkup(
    createElement(Router, {
      ssrPath: "/shop",
      ssrSearch: "",
      children: createElement(Shop),
    })
  );
describe("Shop renders only trustworthy account points", () => {
  it("hides retained cached points after authentication is lost", () => {
    state.authenticated = false;
    state.error = false;
    expect(markup()).not.toContain("999,999");
  });
  it("hides retained cached points after a rewards reconciliation failure", () => {
    state.authenticated = true;
    state.error = true;
    expect(markup()).not.toContain("999,999");
  });
  it("renders returned points only for an authenticated successful record", () => {
    state.authenticated = true;
    state.error = false;
    expect(markup()).toContain("999,999");
  });
});
