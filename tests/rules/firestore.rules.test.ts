import { readFileSync } from "node:fs";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

const projectId = "fieldnote-firestore-rules";

function validKill(ownerId = "owner") {
  const now = Timestamp.fromDate(new Date("2025-06-12T08:00:00.000Z"));
  return {
    id: "kill-1",
    ownerId,
    species: "Greater Kudu",
    coverMediaId: "media-1",
    media: [
      {
        id: "media-1",
        kind: "photo",
        storagePath: `users/${ownerId}/kills/kill-1/media/media-1.jpg`,
      },
    ],
    country: "South Africa",
    date: "2025-06-12",
    killTime: "06:42",
    location: {
      latitude: -33.0183,
      longitude: 27.9035,
      placeName: "Eastern Cape",
    },
    weapon: {
      type: "rifle",
      model: "Sako S20",
      caliber: ".300 Win Mag",
    },
    ammunition: { grain: 180, brand: "Norma", detail: "Bondstrike" },
    route: null,
    description: "A cold morning stalk.",
    status: "active",
    createdAt: now,
    updatedAt: now,
    trashedAt: null,
  };
}

describe("Firestore ownership rules", () => {
  let environment: RulesTestEnvironment;

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await environment.clearFirestore();
  });

  afterAll(async () => {
    await environment.cleanup();
  });

  it("allows an owner to create and read a valid kill", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const kill = doc(owner, "users/owner/kills/kill-1");

    await assertSucceeds(setDoc(kill, validKill()));
    await assertSucceeds(getDoc(kill));
  });

  it("denies unauthenticated reads", async () => {
    const guest = environment.unauthenticatedContext().firestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users/owner/kills/kill-1"),
        validKill(),
      );
    });

    await assertFails(getDoc(doc(guest, "users/owner/kills/kill-1")));
  });

  it("denies cross-user reads and writes", async () => {
    const other = environment.authenticatedContext("other").firestore();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "users/owner/kills/kill-1"),
        validKill(),
      );
    });

    await assertFails(getDoc(doc(other, "users/owner/kills/kill-1")));
    await assertFails(
      setDoc(doc(other, "users/owner/kills/kill-2"), validKill()),
    );
  });

  it("prevents ownership and identity mutation on update", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const kill = doc(owner, "users/owner/kills/kill-1");
    await assertSucceeds(setDoc(kill, validKill()));

    await assertFails(updateDoc(kill, { ownerId: "other" }));
    await assertFails(updateDoc(kill, { id: "replacement" }));
  });

  it("validates the full document again on update", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const kill = doc(owner, "users/owner/kills/kill-1");
    await assertSucceeds(setDoc(kill, validKill()));

    await assertFails(updateDoc(kill, { species: "" }));
    await assertFails(
      updateDoc(kill, {
        media: Array.from({ length: 31 }, (_, index) => ({
          id: `media-${index}`,
          kind: "photo",
          storagePath: `users/owner/kills/kill-1/media/media-${index}.jpg`,
        })),
      }),
    );
  });

  it("rejects a route path linked to another owner or record", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const kill = {
      ...validKill(),
      route: {
        storagePath: "users/other/kills/kill-9/routes/stolen.gpx",
        fileName: "stolen.gpx",
        distanceKm: 1,
        durationMin: 10,
        bounds: { south: 0, west: 0, north: 1, east: 1 },
        sourceHash: "hash",
      },
    };

    await assertFails(
      setDoc(doc(owner, "users/owner/kills/kill-1"), kill),
    );
  });

  it("allows only the authenticated user to maintain their profile", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const now = Timestamp.now();
    const profile = {
      id: "owner",
      displayName: "Marcus Halvorsen",
      avatarUrl: null,
      bio: "Fair chase, every time.",
      createdAt: now,
      updatedAt: now,
    };

    await assertSucceeds(setDoc(doc(owner, "users/owner"), profile));
    await assertFails(getDoc(doc(other, "users/owner")));
  });
});
