import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { ToothSelector } from "./ToothSelector";

describe("ToothSelector", () => {
  it("selects a tooth", () => {
    const onChange = vi.fn();

    render(<ToothSelector value={[]} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tooth UR1",
      }),
    );

    expect(onChange).toHaveBeenCalledWith(["UR1"]);
  });

  it("removes an already selected tooth", () => {
    const onChange = vi.fn();

    render(<ToothSelector value={["UR1", "UL2"]} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tooth UR1",
      }),
    );

    expect(onChange).toHaveBeenCalledWith(["UL2"]);
  });

  it("shows selected quadrant-aware values", () => {
    render(<ToothSelector value={["UR8", "LL1"]} onChange={vi.fn()} />);

    expect(screen.getByText(/Selected: UR8, LL1/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Tooth UR8",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
