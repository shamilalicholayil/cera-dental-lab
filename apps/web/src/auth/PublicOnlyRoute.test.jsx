import { describe, expect, it } from "vitest";

import { Route, Routes } from "react-router-dom";

import { screen } from "@testing-library/react";

import { PublicOnlyRoute } from "./PublicOnlyRoute";

import { renderWithStore } from "../test/renderWithStore";

function TestRoutes() {
  return (
    <Routes>
      <Route path="/portal" element={<div>Portal</div>} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<div>Login</div>} />
      </Route>
    </Routes>
  );
}

describe("PublicOnlyRoute", () => {
  it("allows unauthenticated users to view login", () => {
    renderWithStore(<TestRoutes />, {
      route: "/login",

      preloadedState: {
        auth: {
          user: null,
          status: "idle",
          restoreStatus: "failed",
          error: null,
        },
      },
    });

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("redirects authenticated users to portal", async () => {
    renderWithStore(<TestRoutes />, {
      route: "/login",

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

    expect(await screen.findByText("Portal")).toBeInTheDocument();
  });
});
