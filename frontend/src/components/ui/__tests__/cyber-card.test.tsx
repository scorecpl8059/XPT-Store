import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  WsCard,
  WsCardHeader,
  WsCardTitle,
  WsCardContent,
  WsCardFooter,
} from "../cyber-card";

describe("WsCard", () => {
  it("renders children", () => {
    render(<WsCard>Card content</WsCard>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies hoverable class when hoverable is true", () => {
    const { container } = render(<WsCard hoverable>Hoverable</WsCard>);
    expect(container.firstChild).toHaveClass("hover:border-ws-border-light");
  });

  it("does not apply hoverable class by default", () => {
    const { container } = render(<WsCard>Static</WsCard>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("hover:border-ws-border-light");
  });

  it("merges custom className", () => {
    const { container } = render(<WsCard className="custom">Card</WsCard>);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("forwards ref", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    render(<WsCard ref={ref}>Ref</WsCard>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("WsCardHeader", () => {
  it("renders children", () => {
    render(<WsCardHeader>Header</WsCardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });
});

describe("WsCardTitle", () => {
  it("renders as h3", () => {
    render(<WsCardTitle>Title</WsCardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Title"
    );
  });
});

describe("WsCardContent", () => {
  it("renders children", () => {
    render(<WsCardContent>Content</WsCardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("WsCardFooter", () => {
  it("renders children with border", () => {
    const { container } = render(<WsCardFooter>Footer</WsCardFooter>);
    expect(container.firstChild).toHaveClass("border-t");
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
