import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AccountSearch } from "@/components/social/account-search";
import type { PublicHunt } from "@/lib/domain/public-social";
import { buildPublicHunt } from "@/lib/domain/public-social";
import { DiscoverPage } from "@/src/pages/discover-page";
import { HomeFeedPage } from "@/src/pages/home-feed-page";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

const profile = { id: "other", displayName: "Other Hunter", avatarUrl: null, bio: "Public hunts", searchName: "other hunter", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" };

const socialState = vi.hoisted(() => ({
  hunts: [] as PublicHunt[],
  followingIds: [] as string[],
  likedIds: [] as string[],
  loading: false,
  error: null as string | null,
  toggleFollow: vi.fn(),
  toggleLike: vi.fn(),
}));

vi.mock("@/lib/hooks/use-social", () => ({ useSocial: () => socialState }));
vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "owner" }, loading: false, error: null }),
}));

describe("social discovery", () => {
  beforeEach(() => {
    socialState.hunts = [];
    socialState.followingIds = [];
    socialState.likedIds = [];
    socialState.loading = false;
    socialState.error = null;
  });

  it("searches public accounts and follows a result", async () => {
    const user = userEvent.setup();
    const search = vi.fn().mockResolvedValue([profile]);
    const toggleFollow = vi.fn();
    renderWithRouter(<AccountSearch currentUserId="owner" followingIds={[]} search={search} onToggleFollow={toggleFollow} />);
    await user.type(screen.getByRole("searchbox", { name: /search hunters/i }), "ot");
    expect(await screen.findByText("Other Hunter")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /follow other hunter/i }));
    expect(toggleFollow).toHaveBeenCalledWith("other", false);
  });

  it("shows only followed hunters on the home feed", () => {
    socialState.hunts = [buildPublicHunt(makeKill({ ownerId: "other" }), { ...profile, id: "other" })];

    const { unmount } = renderWithRouter(<HomeFeedPage />);
    expect(screen.queryByText("Greater Kudu")).toBeNull();
    expect(screen.getByText(/your feed is empty/i)).toBeInTheDocument();
    unmount();

    socialState.followingIds = ["other"];
    renderWithRouter(<HomeFeedPage />);
    expect(screen.getByText("Greater Kudu")).toBeInTheDocument();
    expect(screen.getByText("Other Hunter")).toBeInTheDocument();
  });

  it("shows every published hunt on discover", () => {
    socialState.hunts = [buildPublicHunt(makeKill({ ownerId: "other" }), { ...profile, id: "other" })];
    renderWithRouter(<DiscoverPage />);
    expect(
      screen.getByRole("link", { name: /greater kudu by other hunter/i }),
    ).toBeInTheDocument();
  });
});
