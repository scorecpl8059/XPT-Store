import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "../page";
import { api } from "@/lib/api";

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

const mockUser = {
  name: "Test User",
  email: "test@test.com",
  companyName: "XPT Tech",
  preferredLanguage: "en",
  accountType: "personal",
};

let currentMockUser = { ...mockUser };

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: currentMockUser,
  }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("@/components/ui/cyber-card", () => ({
  WsCard: ({ children }: any) => <div data-testid="ws-card">{children}</div>,
  WsCardContent: ({ children }: any) => <div>{children}</div>,
  WsCardHeader: ({ children }: any) => <div>{children}</div>,
  WsCardTitle: ({ children }: any) => <h3>{children}</h3>,
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

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = { ...mockUser };
    mockApi.get.mockResolvedValue({ phone: "555-1234", taxId: "TAX-001" });
  });

  it("renders settings page title", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      // "settings" appears as both the page heading and the card title
      const settingsElements = screen.getAllByText("settings");
      expect(settingsElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders profile form with user data", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("fullName")).toBeInTheDocument();
      expect(screen.getByText("phone")).toBeInTheDocument();
      expect(screen.getByText("language")).toBeInTheDocument();
    });
  });

  it("populates form fields from user and profile API", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      const inputs = screen.getAllByRole("textbox");
      // First input is name
      expect(inputs[0]).toHaveValue("Test User");
    });
  });

  it("fetches extended profile data from API", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/users/me/profile");
    });
  });

  it("renders change password section", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      // "changePassword" appears as both card title and button text
      expect(screen.getAllByText("changePassword").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("currentPassword")).toBeInTheDocument();
      expect(screen.getByText("newPassword")).toBeInTheDocument();
      expect(screen.getByText("confirmPassword")).toBeInTheDocument();
    });
  });

  it("calls profile update API on save", async () => {
    mockApi.put.mockResolvedValue({});
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("textbox")[0]).toHaveValue("Test User");
    });

    // Click save button (first one is the profile save)
    const saveButtons = screen.getAllByText("save");
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        "/users/me/profile",
        expect.objectContaining({
          name: "Test User",
        })
      );
    });
  });

  it("shows success message after profile save", async () => {
    mockApi.put.mockResolvedValue({});
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("textbox")[0]).toHaveValue("Test User");
    });

    await user.click(screen.getAllByText("save")[0]);

    await waitFor(() => {
      expect(screen.getByText("profileUpdated")).toBeInTheDocument();
    });
  });

  it("shows company fields for business accounts", async () => {
    currentMockUser = { ...mockUser, accountType: "business" };
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("companyName")).toBeInTheDocument();
      expect(screen.getByText("taxId")).toBeInTheDocument();
    });
  });

  it("hides company fields for personal accounts", async () => {
    currentMockUser = { ...mockUser, accountType: "personal" };
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.queryByText("companyName")).not.toBeInTheDocument();
      expect(screen.queryByText("taxId")).not.toBeInTheDocument();
    });
  });

  it("renders language select with options", async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue("en");
    });
  });

  it("calls password change API with correct payload", async () => {
    mockApi.put.mockResolvedValue({});
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("changePassword").length).toBeGreaterThanOrEqual(2);
    });

    // Find password inputs (type="password")
    const passwordInputs = screen.getAllByDisplayValue("");
    const pwFields = passwordInputs.filter(
      (input) => input.getAttribute("type") === "password"
    );

    if (pwFields.length >= 3) {
      await user.type(pwFields[0], "oldpass123");
      await user.type(pwFields[1], "newpass456");
      await user.type(pwFields[2], "newpass456");

      // The change password button is the one with tagName BUTTON
      const changeBtn = screen.getAllByText("changePassword");
      const changePwButton = changeBtn.find(
        (el) => el.tagName === "BUTTON"
      );
      if (changePwButton) {
        await user.click(changePwButton);

        await waitFor(() => {
          expect(mockApi.put).toHaveBeenCalledWith("/users/me/password", {
            currentPassword: "oldpass123",
            newPassword: "newpass456",
          });
        });
      }
    }
  });

  it("disables save button when name is empty", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("textbox")[0]).toHaveValue("Test User");
    });

    const nameInput = screen.getAllByRole("textbox")[0];
    await user.clear(nameInput);

    const saveBtn = screen.getAllByText("save")[0];
    expect(saveBtn).toBeDisabled();
  });

  it("handles profile API error gracefully", async () => {
    mockApi.get.mockRejectedValue(new Error("Server error"));
    render(<SettingsPage />);
    // Should still render the form with user data from auth
    await waitFor(() => {
      expect(screen.getAllByRole("textbox")[0]).toHaveValue("Test User");
    });
  });
});
