import { waitFor } from "@testing-library/react";

import { subscribeToFollowers, subscribeToFollowingPeople } from "@/lib/firebase/follow-repository";

const mocks = vi.hoisted(() => ({
  snapshotCallback: null as ((snapshot: { docs: Array<{ id: string; data(): unknown }> }) => void) | null,
  getPublicProfile: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((...path: unknown[]) => ({ path })),
  collectionGroup: vi.fn((_db: unknown, name: string) => ({ group: name })),
  doc: vi.fn(),
  getCountFromServer: vi.fn(),
  onSnapshot: vi.fn((_source: unknown, callback: typeof mocks.snapshotCallback) => {
    mocks.snapshotCallback = callback;
    return mocks.unsubscribe;
  }),
  query: vi.fn((source: unknown) => source),
  Timestamp: { now: vi.fn() },
  where: vi.fn(() => ({})),
  writeBatch: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  getFirebaseServices: () => ({ db: {} }),
}));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  getPublicProfile: mocks.getPublicProfile,
}));

describe("follow repository subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.snapshotCallback = null;
    mocks.getPublicProfile.mockImplementation(async (id: string) => ({
      id,
      displayName: `${id} Hunter`,
      avatarUrl: null,
    }));
  });

  it("caches resolved follower profiles across membership emissions", async () => {
    const onValue = vi.fn();
    subscribeToFollowers("owner", onValue, vi.fn());

    mocks.snapshotCallback?.({
      docs: [
        { id: "first", data: () => ({}) },
        { id: "second", data: () => ({}) },
      ],
    });
    await waitFor(() => expect(onValue).toHaveBeenCalledTimes(1));

    mocks.snapshotCallback?.({
      docs: [
        { id: "first", data: () => ({}) },
        { id: "third", data: () => ({}) },
      ],
    });
    await waitFor(() => expect(onValue).toHaveBeenCalledTimes(2));

    expect(mocks.getPublicProfile).toHaveBeenCalledTimes(3);
    expect(mocks.getPublicProfile).toHaveBeenCalledWith("first");
    expect(onValue).toHaveBeenLastCalledWith([
      { id: "first", displayName: "first Hunter", avatarUrl: null },
      { id: "third", displayName: "third Hunter", avatarUrl: null },
    ]);
  });

  it("resolves followed ids from collection-group edge data", async () => {
    const onValue = vi.fn();
    subscribeToFollowingPeople("viewer", onValue, vi.fn());
    mocks.snapshotCallback?.({
      docs: [{ id: "edge-id", data: () => ({ followedId: "followed" }) }],
    });

    await waitFor(() => expect(onValue).toHaveBeenCalledWith([
      { id: "followed", displayName: "followed Hunter", avatarUrl: null },
    ]));
  });
});
