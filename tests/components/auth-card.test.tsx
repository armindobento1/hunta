import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthCard, type AuthCardActions } from "@/components/auth/auth-card";

function actions(overrides: Partial<AuthCardActions> = {}): AuthCardActions {
  return {
    google: vi.fn().mockResolvedValue(undefined),
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("AuthCard", () => {
  it("switches between sign-in and account creation", async () => {
    const user = userEvent.setup();
    render(<AuthCard actions={actions()} />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getByRole("heading", { name: /start your portfolio/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
  });

  it("validates email and password before sign-in", async () => {
    const user = userEvent.setup();
    const authActions = actions();
    render(<AuthCard actions={authActions} />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least six/i)).toBeInTheDocument();
    expect(authActions.signIn).not.toHaveBeenCalled();
  });

  it("submits safe credentials through the sign-in action", async () => {
    const user = userEvent.setup();
    const authActions = actions();
    render(<AuthCard actions={authActions} />);

    await user.type(screen.getByLabelText(/email/i), "hunter@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(authActions.signIn).toHaveBeenCalledWith(
      "hunter@example.com",
      "correct-horse",
    );
  });

  it("starts Google sign-in from the dedicated button", async () => {
    const user = userEvent.setup();
    const authActions = actions();
    render(<AuthCard actions={authActions} />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(authActions.google).toHaveBeenCalledOnce();
  });

  it("shows provider failures without exposing raw details", async () => {
    const user = userEvent.setup();
    const authActions = actions({
      google: vi.fn().mockRejectedValue({ code: "auth/popup-closed-by-user" }),
    });
    render(<AuthCard actions={authActions} />);

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /closed before it finished/i,
    );
  });
});
