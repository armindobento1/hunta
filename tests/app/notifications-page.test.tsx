import { act, screen } from "@testing-library/react";

import type { SocialNotification } from "@/lib/domain/engagement";
import { NotificationsPage } from "@/src/pages/notifications-page";
import { renderWithRouter } from "@/tests/helpers/render-router";

const mocks = vi.hoisted(() => ({
  onValue: null as ((notifications: SocialNotification[]) => void) | null,
  onError: null as ((error: Error) => void) | null,
  subscribeToNotifications: vi.fn((
    _uid: string,
    onValue: (notifications: SocialNotification[]) => void,
    onError: (error: Error) => void,
  ) => {
    mocks.onValue = onValue;
    mocks.onError = onError;
    return vi.fn();
  }),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "viewer" }, loading: false, error: null }),
}));

vi.mock("@/lib/firebase/engagement-repository", () => ({
  markNotificationRead: vi.fn(),
  subscribeToNotifications: mocks.subscribeToNotifications,
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onValue = null;
    mocks.onError = null;
  });

  it("loads until the first notification snapshot, then shows the empty state", () => {
    renderWithRouter(<NotificationsPage />);

    expect(screen.getByText("Loading…")).toHaveClass("centered-state");
    expect(screen.queryByText("Nothing yet")).not.toBeInTheDocument();

    act(() => mocks.onValue?.([]));

    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });

  it("ends loading when the notification listener fails", () => {
    renderWithRouter(<NotificationsPage />);

    act(() => mocks.onError?.(new Error("Notifications unavailable.")));

    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Notifications unavailable.");
  });
});
