import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressForm } from "../AddressForm";

// Mocks
const mockApiGet = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `checkout.${key}`,
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

vi.mock("@/components/ui/cyber-input", () => ({
  WsInput: (props: any) => <input {...props} />,
  WsLabel: ({ children }: any) => <label>{children}</label>,
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children, onClick, className }: any) => (
    <div data-testid="ws-card" onClick={onClick} className={className}>
      {children}
    </div>
  ),
  WsCardContent: ({ children }: any) => <div>{children}</div>,
}));

const mockSavedAddresses = [
  {
    addressId: "addr-1",
    recipientName: "John Doe",
    phone: "555-1234",
    street1: "123 Main St",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    country: "US",
    isDefault: true,
    label: "Home",
  },
  {
    addressId: "addr-2",
    recipientName: "Jane Doe",
    phone: "555-5678",
    street1: "456 Oak Ave",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    country: "US",
    isDefault: false,
  },
];

describe("AddressForm", () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockReset();
    mockApiGet.mockReset();
  });

  it("shows new address form when no saved addresses exist", async () => {
    mockApiGet.mockResolvedValue([]);
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("US")
      ).toBeInTheDocument();
    });
    // Should show form fields
    expect(screen.getByText("checkout.recipientName")).toBeInTheDocument();
    expect(screen.getByText("checkout.street1")).toBeInTheDocument();
    expect(screen.getByText("checkout.city")).toBeInTheDocument();
  });

  it("shows new address form when API fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("checkout.recipientName")).toBeInTheDocument();
    });
  });

  it("displays saved addresses when they exist", async () => {
    mockApiGet.mockResolvedValue(mockSavedAddresses);
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("(Home)")).toBeInTheDocument();
  });

  it("auto-selects the default address on load", async () => {
    mockApiGet.mockResolvedValue(mockSavedAddresses);
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockSavedAddresses[0]);
    });
  });

  it("calls onSelect when a saved address is clicked", async () => {
    mockApiGet.mockResolvedValue(mockSavedAddresses);
    const user = userEvent.setup();
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    // Click the second address card
    const cards = screen.getAllByTestId("ws-card");
    await user.click(cards[1]);
    expect(mockOnSelect).toHaveBeenCalledWith(mockSavedAddresses[1]);
  });

  it("switches to new address form when 'new address' button is clicked", async () => {
    mockApiGet.mockResolvedValue(mockSavedAddresses);
    const user = userEvent.setup();
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByText(/checkout.newAddress/));

    // Now the form fields should be visible
    expect(screen.getByText("checkout.recipientName")).toBeInTheDocument();
    expect(screen.getByText("checkout.street1")).toBeInTheDocument();
  });

  it("renders the section heading", async () => {
    mockApiGet.mockResolvedValue([]);
    render(<AddressForm onSelect={mockOnSelect} />);
    expect(screen.getByText("checkout.shippingAddress")).toBeInTheDocument();
  });

  it("submits new address when all required fields are filled", async () => {
    mockApiGet.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("checkout.recipientName")).toBeInTheDocument();
    });

    // Fill required fields
    const inputs = screen.getAllByRole("textbox");
    // Fields order: recipientName, phone, street1, street2, city, state, zipCode, country
    await user.type(inputs[0], "Test User");
    await user.type(inputs[2], "789 Elm St");
    await user.type(inputs[4], "Denver");
    await user.type(inputs[5], "CO");
    await user.type(inputs[6], "80201");

    // Click submit button (the one with "checkout.shippingAddress" text inside the form)
    const buttons = screen.getAllByText("checkout.shippingAddress");
    // The last one is the submit button (the first is the heading)
    await user.click(buttons[buttons.length - 1]);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: "Test User",
        street1: "789 Elm St",
        city: "Denver",
        state: "CO",
        zipCode: "80201",
        country: "US",
      })
    );
  });

  it("does not submit when required fields are empty", async () => {
    mockApiGet.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("checkout.recipientName")).toBeInTheDocument();
    });

    // Click submit without filling anything
    const buttons = screen.getAllByText("checkout.shippingAddress");
    await user.click(buttons[buttons.length - 1]);

    // onSelect should not have been called (no auto-select since no saved addresses)
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("shows 'select address' button when switching to new form with saved addresses", async () => {
    mockApiGet.mockResolvedValue(mockSavedAddresses);
    const user = userEvent.setup();
    render(<AddressForm onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByText(/checkout.newAddress/));

    expect(screen.getByText("checkout.selectAddress")).toBeInTheDocument();
  });
});
