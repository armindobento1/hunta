import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PublicHunt } from "@/lib/domain/public-social";
import { buildPublicHunt } from "@/lib/domain/public-social";
import { useSocial } from "@/lib/hooks/use-social";
import { SocialDataProvider } from "@/src/providers/social-data-provider";
import { makeKill } from "@/tests/helpers/kill";

const mocks = vi.hoisted(() => ({
  likeHunt: vi.fn(),
  unlikeHunt: vi.fn(),
  getPublicProfile: vi.fn(),
  subscribeToPublicHunts: vi.fn<(
    onValue: (hunts: PublicHunt[]) => void,
    onError: (error: Error) => void,
    ownerId?: string,
  ) => () => void>(() => vi.fn()),
  subscribeToFollowing: vi.fn<(
    uid: string,
    onValue: (ids: string[]) => void,
    onError: (error: Error) => void,
  ) => () => void>(() => vi.fn()),
  subscribeToLikedHuntIds: vi.fn<(
    uid: string,
    onValue: (ids: string[]) => void,
    onError: (error: Error) => void,
  ) => () => void>(() => vi.fn()),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "viewer" }, loading: false, error: null }),
}));

vi.mock("@/lib/firebase/engagement-repository", () => ({
  likeHunt: mocks.likeHunt,
  unlikeHunt: mocks.unlikeHunt,
}));

vi.mock("@/lib/firebase/follow-repository", () => ({
  followAccount: vi.fn(),
  subscribeToFollowing: mocks.subscribeToFollowing,
  unfollowAccount: vi.fn(),
}));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  getPublicProfile: mocks.getPublicProfile,
  subscribeToLikedHuntIds: mocks.subscribeToLikedHuntIds,
  subscribeToPublicHunts: mocks.subscribeToPublicHunts,
}));

function Probe({ hunt }: { hunt: PublicHunt }) {
  const { error, likedIds, toggleLike } = useSocial();
  return (
    <>
      <span data-testid="liked">{likedIds.includes(hunt.id) ? "liked" : "not liked"}</span>
      <button type="button" onClick={() => void toggleLike(hunt)}>Toggle like</button>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}

describe("SocialDataProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublicProfile.mockResolvedValue({ displayName: "Viewer" });
  });

  it("shows a like failure and reverts the optimistic like", async () => {
    const user = userEvent.setup();
    const hunt = buildPublicHunt(
      makeKill({ ownerId: "owner" }),
      { id: "owner", displayName: "Owner", avatarUrl: null, bio: "", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
    );
    let rejectLike: (reason?: unknown) => void = () => {};
    mocks.likeHunt.mockImplementation(() => new Promise<void>((_resolve, reject) => { rejectLike = reject; }));
    render(
      <SocialDataProvider>
        <Probe hunt={hunt} />
      </SocialDataProvider>,
    );
    act(() => {
      const publishHunts = mocks.subscribeToPublicHunts.mock.calls[0][0];
      const publishFollowing = mocks.subscribeToFollowing.mock.calls[0][1];
      const publishLikes = mocks.subscribeToLikedHuntIds.mock.calls[0][1];
      publishHunts([hunt]);
      publishFollowing([]);
      publishLikes([]);
    });

    await user.click(screen.getByRole("button", { name: "Toggle like" }));
    expect(screen.getByTestId("liked")).toHaveTextContent("liked");

    await act(async () => {
      rejectLike("offline");
      await Promise.resolve();
    });

    expect(screen.getByTestId("liked")).toHaveTextContent("not liked");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not update the like.");
  });
});
