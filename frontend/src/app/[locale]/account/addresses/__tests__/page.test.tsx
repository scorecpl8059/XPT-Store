import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressesPage from "../page";
import { api } from "@/lib/api";

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: any) => <div data-testid="ws-card">{children}</div>,
  WsCardContent: ({ children }: any) => <div>{children}</div>,
  WsCardHeader: ({ children }: any) => <div>{children}</div>,
  WsCardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@/components/ui/cyber-badge", () => ({
  WsBadge: ({ children }: any) => <span data-testid="ws-badge">{children}</span>,
}));

vi.mock("@/components/ui/cyber-button", () => ({
  WsButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("@/components/ui/cyber-input", () => ({
  WsInput: (props: any) => <input {...props} />,
  WsLabel: ({ children }: any) => <label>{children}</label>,
}));

const mockAddress = {
  addressId: "addr-1",
  userId: "u1",
  label: "Home",
  recipientName: "John Doe",
  phone: "555-1234",
  street1: "123 Main St",
  street2: "Apt 4B",
  city: "Portland",
  state: "OR",
  zipCode: "97201",
  country: "US",
  isDefault: true,
};

const mockAddress2 = {
  addressId: "addr-2",
  userId: "u1",
  label: "Office",
  recipientName: "John Doe",
  phone: "555-5678",
  street1: "456 Work Ave",
  city: "Portland",
  state: "OR",
  zipCode: "97202",
  country: "US",
  isDefault: false,
};

describe("AddressesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    render(<AddressesPage />);
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("renders page title and add button after loading", async () => {
    mockApi.get.mockResolvedValue({ addresses: [] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("savedAddresses")).toBeInTheDocument();
      expect(screen.getByText("addAddress")).toBeInTheDocument();
    });
  });

  it("shows empty state when no addresses exist", async () => {
    mockApi.get.mockResolvedValue({ addresses: [] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("noAddresses")).toBeInTheDocument();
    });
  });

  it("renders address cards with details", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress, mockAddress2] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBe(2);
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("Apt 4B")).toBeInTheDocument();
      expect(screen.getByText("Portland, OR 97201")).toBeInTheDocument();
    });
  });

  it("shows default address badge", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("defaultAddress")).toBeInTheDocument();
    });
  });

  it("shows address label", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  it("opens add address form when add button is clicked", async () => {
    mockApi.get.mockResolvedValue({ addresses: [] });
    const user = userEvent.setup();
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("addAddress")).toBeInTheDocument();
    });
    await user.click(screen.getByText("addAddress"));
    await waitFor(() => {
      expect(screen.getByText("recipientName")).toBeInTheDocument();
      expect(screen.getByText("phone")).toBeInTheDocument();
      expect(screen.getByText("street1")).toBeInTheDocument();
      expect(screen.getByText("city")).toBeInTheDocument();
    });
  });

  it("shows cancel button in form to dismiss it", async () => {
    mockApi.get.mockResolvedValue({ addresses: [] });
    const user = userEvent.setup();
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("addAddress")).toBeInTheDocument();
    });
    await user.click(screen.getByText("addAddress"));
    await waitFor(() => {
      expect(screen.getByText("cancel")).toBeInTheDocument();
    });
    await user.click(screen.getByText("cancel"));
    await waitFor(() => {
      expect(screen.queryByText("recipientName")).not.toBeInTheDocument();
    });
  });

  it("calls API to create new address on save", async () => {
    mockApi.get.mockResolvedValue({ addresses: [] });
    mockApi.post.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AddressesPage />);

    await waitFor(() => {
      expect(screen.getByText("addAddress")).toBeInTheDocument();
    });
    await user.click(screen.getByText("addAddress"));

    // Fill required fields
    const inputs = screen.getAllByRole("textbox");
    // recipientName, phone, street1, street2, city, state, zipCode, country
    await user.type(inputs[0], "Jane Smith");
    await user.type(inputs[2], "789 Elm St");
    await user.type(inputs[4], "Seattle");

    await user.click(screen.getByText("save"));
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/users/me/addresses",
        expect.objectContaining({
          recipientName: "Jane Smith",
          street1: "789 Elm St",
          city: "Seattle",
        })
      );
    });
  });

  it("shows confirm delete button on delete click", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress2] });
    const user = userEvent.setup();
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("456 Work Ave")).toBeInTheDocument();
    });

    // Find all buttons — addAddress, edit icon, trash icon
    const buttons = screen.getAllByRole("button");
    // The trash button is the last one (after addAddress and edit icon)
    const trashBtn = buttons[buttons.length - 1];
    await user.click(trashBtn);
    // After first click, should show confirmDelete
    await waitFor(() => {
      expect(screen.getByText("confirmDelete")).toBeInTheDocument();
    });
  });

  it("calls delete API on confirm delete", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress2] });
    mockApi.delete.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("456 Work Ave")).toBeInTheDocument();
    });

    // Click delete icon first, then confirmDelete
    const allButtons = screen.getAllByRole("button");
    // Click the last non-addAddress button (the trash button)
    const trashBtn = allButtons[allButtons.length - 1];
    await user.click(trashBtn);

    await waitFor(() => {
      expect(screen.getByText("confirmDelete")).toBeInTheDocument();
    });
    await user.click(screen.getByText("confirmDelete"));

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith("/users/me/addresses/addr-2");
    });
  });

  it("handles API errors gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("noAddresses")).toBeInTheDocument();
    });
  });

  it("displays phone number for address", async () => {
    mockApi.get.mockResolvedValue({ addresses: [mockAddress] });
    render(<AddressesPage />);
    await waitFor(() => {
      expect(screen.getByText("555-1234")).toBeInTheDocument();
    });
  });
});
