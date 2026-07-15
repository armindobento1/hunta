import { act, renderHook } from "@testing-library/react";

import type { HuntComment } from "@/lib/domain/engagement";
import { buildPublicHunt } from "@/lib/domain/public-social";
import { useHuntEngagement } from "@/lib/hooks/use-engagement";
import { makeKill } from "@/tests/helpers/kill";

const mocks = vi.hoisted(() => ({
  setCommentLiked: vi.fn().mockResolvedValue(undefined),
  subscribeToHuntLikes: vi.fn(() => vi.fn()),
  subscribeToHuntComments: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "viewer" }, loading: false, error: null }),
}));

vi.mock("@/lib/firebase/engagement-repository", () => ({
  addHuntComment: vi.fn(),
  deleteHuntComment: vi.fn(),
  likeHunt: vi.fn(),
  setCommentLiked: mocks.setCommentLiked,
  subscribeToHuntComments: mocks.subscribeToHuntComments,
  subscribeToHuntLikes: mocks.subscribeToHuntLikes,
  unlikeHunt: vi.fn(),
}));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  getPublicProfile: vi.fn(),
}));

describe("useHuntEngagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the negated current comment-like state as the repository target", async () => {
    const hunt = buildPublicHunt(
      makeKill({ ownerId: "owner" }),
      { id: "owner", displayName: "Owner", avatarUrl: null, bio: "", createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" },
    );
    const baseComment: HuntComment = {
      id: "comment-1",
      huntId: hunt.id,
      authorId: "author",
      authorName: "Author",
      body: "Comment",
      createdAt: "2025-06-12T09:00:00.000Z",
      updatedAt: "2025-06-12T09:00:00.000Z",
    };
    const { result } = renderHook(() => useHuntEngagement(hunt));

    await act(() => result.current.toggleCommentLike({ ...baseComment, likedBy: ["viewer"] }));
    await act(() => result.current.toggleCommentLike({ ...baseComment, likedBy: [] }));

    expect(mocks.setCommentLiked).toHaveBeenNthCalledWith(1, hunt.id, baseComment.id, "viewer", false);
    expect(mocks.setCommentLiked).toHaveBeenNthCalledWith(2, hunt.id, baseComment.id, "viewer", true);
  });
});
