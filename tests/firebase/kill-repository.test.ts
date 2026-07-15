import { moveKillToTrash } from "@/lib/firebase/kill-repository";
import { makeKill } from "@/tests/helpers/kill";

const mocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
  getDoc: mocks.getDoc,
  onSnapshot: vi.fn(),
  setDoc: mocks.setDoc,
  Timestamp: {
    fromDate: vi.fn((value: Date) => value),
  },
}));

vi.mock("@/lib/firebase/config", () => ({
  getFirebaseServices: () => ({ db: {} }),
}));

describe("moveKillToTrash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => makeKill({ isPublic: true }),
    });
  });

  it("always persists a trashed kill as private", async () => {
    const result = await moveKillToTrash("owner-1", "kill-1");

    expect(result).toMatchObject({ status: "trashed", isPublic: false });
    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "trashed", isPublic: false }),
    );
  });
});
