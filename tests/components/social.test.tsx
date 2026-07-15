import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";

import { AccountSearch } from "@/components/social/account-search";
import { CommentSection } from "@/components/social/hunt-engagement";
import { HuntPostCard } from "@/components/social/hunt-post-card";
import { PublicHuntDetail } from "@/components/social/public-hunt-detail";
import type { HuntComment } from "@/lib/domain/engagement";
import type { PublicHunt } from "@/lib/domain/public-social";
import { buildPublicHunt } from "@/lib/domain/public-social";
import type { HuntEngagementState } from "@/lib/hooks/use-engagement";
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
const detailEngagement = vi.hoisted(() => ({
  likes: [] as Array<{ huntId: string; likerId: string; likerName: string; createdAt: string }>,
  comments: [],
  likedByMe: false,
  viewerId: "owner" as string | null,
  error: null as string | null,
  toggleLike: vi.fn().mockResolvedValue(undefined),
  addComment: vi.fn().mockResolvedValue(true),
  toggleCommentLike: vi.fn().mockResolvedValue(undefined),
  removeComment: vi.fn().mockResolvedValue(undefined),
}));
const viewerState = vi.hoisted(() => ({
  viewerId: "owner" as string | null,
  followingIds: [] as string[] | null,
  toggle: vi.fn().mockResolvedValue(true),
  error: null as string | null,
}));

vi.mock("@/lib/hooks/use-social", () => ({ useSocial: () => socialState }));
vi.mock("@/lib/hooks/use-engagement", () => ({ useHuntEngagement: () => detailEngagement }));
vi.mock("@/lib/hooks/use-viewer-following", () => ({ useViewerFollowing: () => viewerState }));
vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "owner" }, loading: false, error: null }),
}));

function publicHunt() {
  return buildPublicHunt(makeKill({ ownerId: "other" }), profile);
}

function engagementWith(comments: HuntComment[], overrides: Partial<HuntEngagementState> = {}): HuntEngagementState {
  return {
    likes: [],
    comments,
    likedByMe: false,
    viewerId: "commenter",
    error: null,
    toggleLike: vi.fn().mockResolvedValue(undefined),
    addComment: vi.fn().mockResolvedValue(true),
    toggleCommentLike: vi.fn().mockResolvedValue(undefined),
    removeComment: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function comment(overrides: Partial<HuntComment> = {}): HuntComment {
  return {
    id: "comment-1",
    huntId: "other_kill-1",
    authorId: "commenter",
    authorName: "Comment Hunter",
    body: "Great hunt",
    likedBy: [],
    createdAt: "2025-06-12T09:00:00.000Z",
    updatedAt: "2025-06-12T09:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("social discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socialState.hunts = [];
    socialState.followingIds = [];
    socialState.likedIds = [];
    socialState.loading = false;
    socialState.error = null;
    detailEngagement.likes = [];
    detailEngagement.comments = [];
    detailEngagement.likedByMe = false;
    detailEngagement.viewerId = "owner";
    viewerState.viewerId = "owner";
    viewerState.followingIds = [];
    viewerState.error = null;
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

  it("likes an unliked feed card after two nearby pointer taps", () => {
    vi.useFakeTimers();
    const hunt = publicHunt();
    const { container } = renderWithRouter(<HuntPostCard hunt={hunt} />);
    const media = container.querySelector(".soc-media");

    expect(media).not.toBeNull();
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(250);
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 20, clientY: 20 });

    expect(socialState.toggleLike).toHaveBeenCalledOnce();
    expect(socialState.toggleLike).toHaveBeenCalledWith(hunt);
    expect(container.querySelector(".soc-heart-burst")).toBeInTheDocument();
  });

  it("bursts but does not toggle an already-liked feed card on double-tap", () => {
    vi.useFakeTimers();
    const hunt = publicHunt();
    socialState.likedIds = [hunt.id];
    const { container } = renderWithRouter(<HuntPostCard hunt={hunt} />);
    const media = container.querySelector(".soc-media");

    expect(media).not.toBeNull();
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(250);
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 20, clientY: 20 });

    expect(socialState.toggleLike).not.toHaveBeenCalled();
    expect(container.querySelector(".soc-heart-burst")).toBeInTheDocument();
  });

  it("does not double-tap like when pointer taps are more than 300ms apart", () => {
    vi.useFakeTimers();
    const hunt = publicHunt();
    const { container } = renderWithRouter(<HuntPostCard hunt={hunt} />);
    const media = container.querySelector(".soc-media");

    expect(media).not.toBeNull();
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });
    vi.advanceTimersByTime(301);
    fireEvent.pointerUp(media!, { isPrimary: true, button: 0, clientX: 10, clientY: 10 });

    expect(socialState.toggleLike).not.toHaveBeenCalled();
    expect(container.querySelector(".soc-heart-burst")).not.toBeInTheDocument();
  });

  it("links a feed like count to the hunt likers route", () => {
    const hunt = { ...publicHunt(), likeCount: 2 };
    renderWithRouter(<HuntPostCard hunt={hunt} />);

    expect(screen.getByRole("link", { name: "2 likes" })).toHaveAttribute(
      "href",
      `/people/${hunt.ownerId}/hunts/${hunt.id}/likes`,
    );
  });

  it("links hunt-detail and comment summaries to the hunt likers route", () => {
    const hunt = publicHunt();
    detailEngagement.likes = [
      { huntId: hunt.id, likerId: "liker-1", likerName: "First Hunter", createdAt: "2025-06-12T09:00:00.000Z" },
      { huntId: hunt.id, likerId: "liker-2", likerName: "Second Hunter", createdAt: "2025-06-12T10:00:00.000Z" },
    ];
    const { container } = renderWithRouter(<PublicHuntDetail hunt={hunt} />);
    const links = container.querySelectorAll<HTMLAnchorElement>(`a[href="/people/${hunt.ownerId}/hunts/${hunt.id}/likes"]`);

    expect(links).toHaveLength(2);
    expect(container.querySelector(".hd-body")?.querySelector("a")).toHaveTextContent("2 likes");
    expect(container.querySelector(".cmt-likerow")?.querySelector("a")).toHaveTextContent("2 likes");
  });

  it("shows an alert when copying a hunt link is unavailable", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });
    renderWithRouter(<PublicHuntDetail hunt={publicHunt()} />);

    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy hunt link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Copying isn't available here.");
  });

  it("toggles video playback with an accessible button", async () => {
    const user = userEvent.setup();
    const hunt = buildPublicHunt(makeKill({
      ownerId: "other",
      coverMediaId: "video-1",
      media: [{
        id: "video-1",
        kind: "video",
        storagePath: "users/other/kills/kill-1/media/video-1.mp4",
        downloadUrl: "https://example.com/hunt.mp4",
        fileName: "hunt.mp4",
        contentType: "video/mp4",
        sizeBytes: 4096,
        createdAt: "2025-06-12T04:40:00.000Z",
      }],
    }), profile);
    const { container } = renderWithRouter(<PublicHuntDetail hunt={hunt} />);
    const video = container.querySelector("video");
    let paused = true;
    const play = vi.fn(() => {
      paused = false;
      fireEvent.play(video!);
      return Promise.resolve();
    });
    const pause = vi.fn(() => {
      paused = true;
      fireEvent.pause(video!);
    });
    Object.defineProperties(video!, {
      paused: { configurable: true, get: () => paused },
      play: { configurable: true, value: play },
      pause: { configurable: true, value: pause },
    });

    const playButton = screen.getByRole("button", { name: "Play video" });
    await user.click(playButton);
    expect(play).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Pause video" })).toBe(playButton);

    await user.click(playButton);
    expect(pause).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Play video" })).toBe(playButton);
  });

  it("does not render the unfinished Save control", () => {
    renderWithRouter(<PublicHuntDetail hunt={publicHunt()} />);

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("links root and reply author names and avatars to their profiles", () => {
    const root = comment();
    const reply = comment({
      id: "reply-1",
      authorId: "replier",
      authorName: "Reply Hunter",
      parentId: root.id,
    });

    renderWithRouter(<CommentSection hunt={publicHunt()} engagement={engagementWith([root, reply])} />);

    const rootLinks = screen.getAllByRole("link", { name: "Comment Hunter" });
    const replyLinks = screen.getAllByRole("link", { name: "Reply Hunter" });
    expect(rootLinks).toHaveLength(2);
    expect(replyLinks).toHaveLength(2);
    rootLinks.forEach((link) => expect(link).toHaveAttribute("href", "/people/commenter"));
    replyLinks.forEach((link) => expect(link).toHaveAttribute("href", "/people/replier"));
  });

  it("deletes a comment when confirmation is accepted", async () => {
    const user = userEvent.setup();
    const target = comment();
    let finishDelete = () => {};
    const removeComment = vi.fn(() => new Promise<void>((resolve) => { finishDelete = resolve; }));
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("confirm", confirm);
    renderWithRouter(
      <CommentSection hunt={publicHunt()} engagement={engagementWith([target], { removeComment })} />,
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(removeComment).toHaveBeenCalledWith(target);
    expect(deleteButton).toBeDisabled();
    expect(confirm).toHaveBeenCalledWith("Delete this comment?");
    await act(async () => finishDelete());
    expect(deleteButton).toBeEnabled();
  });

  it("keeps a comment when deletion confirmation is dismissed", async () => {
    const user = userEvent.setup();
    const target = comment();
    const removeComment = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirm);
    renderWithRouter(
      <CommentSection hunt={publicHunt()} engagement={engagementWith([target], { removeComment })} />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(removeComment).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledWith("Delete this comment?");
  });
});
