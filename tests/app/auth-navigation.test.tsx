import { render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  useLocation,
} from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthRedirect } from "@/components/auth/auth-redirect";

const authState = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  loading: false,
  error: null as string | null,
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => authState,
}));

function LocationProbe() {
  return <span>{useLocation().pathname}</span>;
}

describe("authentication navigation", () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
    authState.error = null;
  });

  it("redirects unauthenticated private routes to auth", async () => {
    render(
      <MemoryRouter initialEntries={["/portfolio"]}>
        <AuthGuard>
          <div>Private portfolio</div>
        </AuthGuard>
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("/auth")).toBeInTheDocument());
    expect(screen.queryByText("Private portfolio")).toBeNull();
  });

  it("redirects authenticated visitors away from auth", async () => {
    authState.user = { uid: "owner-1" };
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthRedirect />
        <LocationProbe />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText("/home")).toBeInTheDocument(),
    );
  });
});
