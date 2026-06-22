import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WsBadge } from "../cyber-badge";

describe("WsBadge", () => {
  it("renders children", () => {
    render(<WsBadge>Active</WsBadge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies blue variant by default", () => {
    const { container } = render(<WsBadge>Blue</WsBadge>);
    expect(container.firstChild).toHaveClass("text-ws-blue");
  });

  it("applies green variant", () => {
    const { container } = render(<WsBadge variant="green">Green</WsBadge>);
    expect(container.firstChild).toHaveClass("text-ws-green");
  });

  it("applies amber variant", () => {
    const { container } = render(<WsBadge variant="amber">Amber</WsBadge>);
    expect(container.firstChild).toHaveClass("text-ws-amber");
  });

  it("applies red variant", () => {
    const { container } = render(<WsBadge variant="red">Red</WsBadge>);
    expect(container.firstChild).toHaveClass("text-ws-red");
  });

  it("applies muted variant", () => {
    const { container } = render(<WsBadge variant="muted">Muted</WsBadge>);
    expect(container.firstChild).toHaveClass("text-ws-text-muted");
  });

  it("renders dot indicator when dot prop is true", () => {
    const { container } = render(<WsBadge dot>With dot</WsBadge>);
    const dot = container.querySelector(".rounded-full");
    expect(dot).toBeInTheDocument();
  });

  it("does not render dot by default", () => {
    const { container } = render(<WsBadge>No dot</WsBadge>);
    const dot = container.querySelector(".rounded-full");
    expect(dot).not.toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(
      <WsBadge className="my-badge">Custom</WsBadge>
    );
    expect(container.firstChild).toHaveClass("my-badge");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLSpanElement | null>;
    render(<WsBadge ref={ref}>Ref</WsBadge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
