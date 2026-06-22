import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WsButton } from "../cyber-button";

describe("WsButton", () => {
  it("renders children", () => {
    render(<WsButton>Click me</WsButton>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies primary variant by default", () => {
    render(<WsButton>Primary</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-ws-blue");
  });

  it("applies secondary variant", () => {
    render(<WsButton variant="secondary">Secondary</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-ws-elevated");
  });

  it("applies destructive variant", () => {
    render(<WsButton variant="destructive">Delete</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-ws-red");
  });

  it("applies size sm", () => {
    render(<WsButton size="sm">Small</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-8");
  });

  it("applies size lg", () => {
    render(<WsButton size="lg">Large</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-11");
  });

  it("applies icon size", () => {
    render(<WsButton size="icon">X</WsButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("w-9");
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<WsButton onClick={() => (clicked = true)}>Click</WsButton>);
    await user.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  it("is disabled when disabled prop is set", () => {
    render(<WsButton disabled>Disabled</WsButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("merges custom className", () => {
    render(<WsButton className="my-class">Custom</WsButton>);
    expect(screen.getByRole("button").className).toContain("my-class");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
    render(<WsButton ref={ref}>Ref</WsButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
