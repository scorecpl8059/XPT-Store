import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountNav } from "../AccountNav";

let mockPathname = "/account";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, className }: any) => (
    <a href={typeof href === "string" ? href : "/"} className={className}>{children}</a>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("AccountNav", () => {
  beforeEach(() => {
    mockPathname = "/account";
  });

  it("renders all navigation items", () => {
    render(<AccountNav />);
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("orders")).toBeInTheDocument();
    expect(screen.getByText("addresses")).toBeInTheDocument();
    expect(screen.getByText("wishlist")).toBeInTheDocument();
    expect(screen.getByText("reviews")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("renders navigation links with correct hrefs", () => {
    render(<AccountNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveAttribute("href", "/account");
    expect(links[1]).toHaveAttribute("href", "/account/orders");
    expect(links[2]).toHaveAttribute("href", "/account/addresses");
    expect(links[3]).toHaveAttribute("href", "/account/wishlist");
    expect(links[4]).toHaveAttribute("href", "/account/reviews");
    expect(links[5]).toHaveAttribute("href", "/account/settings");
  });

  it("highlights dashboard link when on /account", () => {
    mockPathname = "/account";
    render(<AccountNav />);
    const dashboardLink = screen.getByText("dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-ws-blue/10");
  });

  it("highlights orders link when on /account/orders", () => {
    mockPathname = "/en/account/orders";
    render(<AccountNav />);
    const ordersLink = screen.getByText("orders").closest("a");
    expect(ordersLink?.className).toContain("bg-ws-blue/10");
  });

  it("does not highlight dashboard when on a sub-page", () => {
    mockPathname = "/en/account/orders";
    render(<AccountNav />);
    const dashboardLink = screen.getByText("dashboard").closest("a");
    expect(dashboardLink?.className).not.toContain("bg-ws-blue/10");
  });

  it("highlights settings link when on /account/settings", () => {
    mockPathname = "/en/account/settings";
    render(<AccountNav />);
    const settingsLink = screen.getByText("settings").closest("a");
    expect(settingsLink?.className).toContain("bg-ws-blue/10");
  });

  it("strips locale prefix for route matching", () => {
    mockPathname = "/zh-CN/account/wishlist";
    render(<AccountNav />);
    const wishlistLink = screen.getByText("wishlist").closest("a");
    expect(wishlistLink?.className).toContain("bg-ws-blue/10");
  });
});
