import { unpublishHunt } from "@/lib/firebase/public-social-repository";

const mocks = vi.hoisted(() => ({
  batchSizes: [] as number[],
  commentPages: [] as number[],
  deleteDoc: vi.fn(async () => {
    mocks.events.push("parent:delete");
  }),
  events: [] as string[],
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  likePages: [] as number[],
  parentExists: true,
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
  deleteDoc: mocks.deleteDoc,
  doc: vi.fn((base: { path?: string[] }, ...path: string[]) => ({
    path: [...(base.path ?? []), ...path],
  })),
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  limit: vi.fn((count: number) => ({ count })),
  query: vi.fn((source: unknown) => source),
  writeBatch: vi.fn(() => {
    const deleted: unknown[] = [];
    return {
      delete: (ref: unknown) => deleted.push(ref),
      commit: async () => {
        mocks.batchSizes.push(deleted.length);
        mocks.events.push(`batch:${deleted.length}`);
      },
    };
  }),
}));

vi.mock("@/lib/firebase/config", () => ({
  getFirebaseServices: () => ({ db: {} }),
}));

describe("unpublishHunt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.batchSizes.length = 0;
    mocks.commentPages = [];
    mocks.events.length = 0;
    mocks.likePages = [];
    mocks.parentExists = true;
    mocks.getDoc.mockImplementation(async () => ({
      exists: () => mocks.parentExists,
    }));
    mocks.getDocs.mockImplementation(async (source: { path: string[] }) => {
      const pages = source.path.at(-1) === "likes"
        ? mocks.likePages
        : mocks.commentPages;
      const count = pages.shift() ?? 0;
      return {
        empty: count === 0,
        docs: Array.from({ length: count }, (_, index) => ({
          ref: { path: [...source.path, `entry-${index}`] },
        })),
      };
    });
  });

  it("deletes paginated engagement in separate batches and deletes the parent last", async () => {
    mocks.likePages = [400, 1, 0];
    mocks.commentPages = [1, 0, 0];

    await unpublishHunt("owner-1", "kill-1");

    expect(mocks.getDocs).toHaveBeenCalledTimes(6);
    expect(mocks.batchSizes).toEqual([400, 1, 1]);
    expect(mocks.batchSizes.every((size) => size <= 400)).toBe(true);
    expect(mocks.events.at(-1)).toBe("parent:delete");
    expect(mocks.deleteDoc).toHaveBeenCalledOnce();
  });

  it("sweeps orphaned engagement without deleting a missing parent", async () => {
    mocks.parentExists = false;
    mocks.likePages = [2, 0];
    mocks.commentPages = [0, 0];

    await expect(unpublishHunt("owner-1", "kill-1")).resolves.toBeUndefined();

    expect(mocks.getDocs).toHaveBeenCalledTimes(4);
    expect(mocks.batchSizes).toEqual([2]);
    expect(mocks.deleteDoc).not.toHaveBeenCalled();
  });

  it("stops after the cleanup cap when engagement never becomes empty", async () => {
    mocks.likePages = Array.from({ length: 21 }, () => 1);
    mocks.commentPages = Array.from({ length: 21 }, () => 0);

    await expect(unpublishHunt("owner-1", "kill-1")).rejects.toThrow(
      "Could not unpublish hunt after 20 cleanup passes",
    );

    expect(mocks.batchSizes).toHaveLength(20);
    expect(mocks.deleteDoc).not.toHaveBeenCalled();
  });
});
