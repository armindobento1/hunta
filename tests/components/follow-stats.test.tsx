import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { FollowStats } from "@/components/portfolio/follow-stats";
import { PublicProfileView } from "@/components/social/public-profile-view";
import { renderWithRouter } from "@/tests/helpers/render-router";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn().mockResolvedValue(undefined),
  toggle: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/hooks/use-follow-stats", () => ({
  useFollowStats: () => ({
    counts: { followers: 4, following: 7 },
    error: null,
    refresh: mocks.refresh,
  }),
}));
vi.mock("@/lib/hooks/use-viewer-following", () => ({
  useViewerFollowing: () => ({
    viewerId: "viewer",
    followingIds: [],
    error: null,
    toggle: mocks.toggle,
  }),
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("FollowStats", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["Followers", "/people/viewer/followers"],
    ["Following", "/people/viewer/following"],
  ])("navigates from %s to the shared people route", async (label, path) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/portfolio"]}>
        <Routes>
          <Route path="*" element={<><FollowStats uid="viewer" /><CurrentPath /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: new RegExp(label, "i") }));

    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(path);
  });

  it("refreshes public profile counts after a successful follow", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PublicProfileView
        profile={{
          id: "hunter",
          displayName: "Public Hunter",
          avatarUrl: null,
          bio: "",
          searchName: "public hunter",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        }}
        hunts={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Follow" }));

    expect(mocks.toggle).toHaveBeenCalledWith("hunter");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps a cancelled native profile share silent", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    vi.stubGlobal("navigator", { ...navigator, share });
    renderWithRouter(
      <PublicProfileView
        profile={{
          id: "hunter",
          displayName: "Public Hunter",
          avatarUrl: null,
          bio: "",
          searchName: "public hunter",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        }}
        hunts={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Share profile" }));

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
