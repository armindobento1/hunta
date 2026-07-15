import { act, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { HuntLike } from "@/lib/domain/engagement";
import type { FollowPerson } from "@/lib/firebase/follow-repository";
import { FollowListPage } from "@/src/pages/follow-list-page";
import { HuntLikersPage } from "@/src/pages/hunt-likers-page";

const mocks = vi.hoisted(() => ({
  likesCallback: null as ((likes: HuntLike[]) => void) | null,
  followersCallback: null as ((people: FollowPerson[]) => void) | null,
  followingCallback: null as ((people: FollowPerson[]) => void) | null,
  resolvePeople: vi.fn(),
  toggle: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/firebase/engagement-repository", () => ({
  subscribeToHuntLikes: (_huntId: string, callback: (likes: HuntLike[]) => void) => {
    mocks.likesCallback = callback;
    return vi.fn();
  },
}));

vi.mock("@/lib/firebase/follow-repository", () => ({
  resolvePeople: mocks.resolvePeople,
  subscribeToFollowers: (_uid: string, callback: (people: FollowPerson[]) => void) => {
    mocks.followersCallback = callback;
    return vi.fn();
  },
  subscribeToFollowingPeople: (_uid: string, callback: (people: FollowPerson[]) => void) => {
    mocks.followingCallback = callback;
    return vi.fn();
  },
}));

vi.mock("@/lib/hooks/use-viewer-following", () => ({
  useViewerFollowing: () => ({
    viewerId: "viewer",
    followingIds: ["liker"],
    toggle: mocks.toggle,
    error: null,
  }),
}));

function renderAt(path: string, routePath: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("live people lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.likesCallback = null;
    mocks.followersCallback = null;
    mocks.followingCallback = null;
    mocks.resolvePeople.mockImplementation(async (ids: string[]) => ids.map((id) => ({
      id,
      displayName: id === "viewer" ? "Viewer Hunter" : "Liker Hunter",
      avatarUrl: id === "liker" ? "https://example.com/liker.jpg" : null,
    })));
  });

  it("renders resolved likers with profile links and no toggle on the viewer row", async () => {
    renderAt(
      "/people/owner/hunts/hunt-1/likes",
      "/people/:uid/hunts/:publicHuntId/likes",
      <HuntLikersPage />,
    );
    act(() => mocks.likesCallback?.([
      { huntId: "hunt-1", likerId: "viewer", likerName: "Viewer Hunter", createdAt: "2025-06-12T09:00:00.000Z" },
      { huntId: "hunt-1", likerId: "liker", likerName: "Liker Hunter", createdAt: "2025-06-12T10:00:00.000Z" },
    ]));

    const viewerLink = await screen.findByRole("link", { name: "Viewer Hunter" });
    const likerLink = screen.getByRole("link", { name: "Liker Hunter" });
    expect(viewerLink).toHaveAttribute("href", "/people/viewer");
    expect(likerLink).toHaveAttribute("href", "/people/liker");
    expect(within(viewerLink.closest("li")!).queryByRole("button")).toBeNull();
    expect(within(likerLink.closest("li")!).getByRole("button", { name: "Following" })).toBeInTheDocument();
    expect(likerLink.closest("li")?.querySelector("img")).toHaveAttribute("src", "https://example.com/liker.jpg");
  });

  it("shows the likers empty state", async () => {
    renderAt(
      "/people/owner/hunts/hunt-1/likes",
      "/people/:uid/hunts/:publicHuntId/likes",
      <HuntLikersPage />,
    );
    act(() => mocks.likesCallback?.([]));

    expect(await screen.findByText("Nobody yet.")).toBeInTheDocument();
    expect(screen.getByText("0", { selector: ".sheet-count" })).toBeInTheDocument();
  });

  it("removes a dropped following member and updates the count without remounting", async () => {
    const first = { id: "first", displayName: "First Hunter", avatarUrl: null };
    const second = { id: "second", displayName: "Second Hunter", avatarUrl: null };
    const { container } = renderAt(
      "/people/viewer/following",
      "/people/:uid/following",
      <FollowListPage kind="following" />,
    );
    act(() => mocks.followingCallback?.([first, second]));

    expect(await screen.findByRole("link", { name: "Second Hunter" })).toBeInTheDocument();
    expect(container.querySelector(".sheet-count")).toHaveTextContent("2");

    act(() => mocks.followingCallback?.([first]));

    await waitFor(() => expect(screen.queryByRole("link", { name: "Second Hunter" })).toBeNull());
    expect(container.querySelector(".sheet-count")).toHaveTextContent("1");
    expect(screen.getByRole("link", { name: "First Hunter" })).toBeInTheDocument();
  });
});
