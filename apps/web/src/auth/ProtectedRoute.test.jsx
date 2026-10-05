import { describe, expect, it } from "vitest";

import { Route, Routes } from "react-router-dom";

import { screen } from "@testing-library/react";

import { ProtectedRoute } from "./ProtectedRoute";

import { renderWithStore } from "../test/renderWithStore";

function TestRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login page</div>} />

      <Route element={<ProtectedRoute />}>
        <Route path="/portal" element={<div>Protected portal</div>} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  it("shows loading UI while authentication is being restored", () => {
    renderWithStore(<TestRoutes />, {
      route: "/portal",

      preloadedState: {
        auth: {
          user: null,
          status: "idle",
          restoreStatus: "loading",
          error: null,
        },
      },
    });

    expect(
      screen.getByText("Preparing your Cera workspace..."),
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", async () => {
    renderWithStore(<TestRoutes />, {
      route: "/portal",

      preloadedState: {
        auth: {
          user: null,
          status: "idle",
          restoreStatus: "failed",
          error: null,
        },
      },
    });

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("allows authenticated users into protected routes", () => {
    renderWithStore(<TestRoutes />, {
      route: "/portal",

      preloadedState: {
        auth: {
          user: {
            id: "user-1",
            name: "Cera Admin",
            role: "CERA_ADMIN",
          },

          status: "succeeded",

          restoreStatus: "succeeded",

          error: null,
        },
      },
    });

    expect(screen.getByText("Protected portal")).toBeInTheDocument();
  });
});
