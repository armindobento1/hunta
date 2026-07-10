import { readFileSync } from "node:fs";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";

const projectId = "hunta-firestore-rules";

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

  it("isolates armory items and loadouts by authenticated owner", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const now = Timestamp.now();
    const weapon = { id: "weapon-1", ownerId: "owner", name: "Sako S20", kind: "weapon", weapon: { type: "rifle", model: "Sako S20", caliber: ".300 Win Mag" }, createdAt: now, updatedAt: now };
    const loadout = { id: "loadout-1", ownerId: "owner", name: "Kudu setup", weaponId: "weapon-1", slots: {}, isDefault: true, createdAt: now, updatedAt: now };

    await assertSucceeds(setDoc(doc(owner, "users/owner/armoryItems/weapon-1"), weapon));
    await assertSucceeds(setDoc(doc(owner, "users/owner/loadouts/loadout-1"), loadout));
    await assertFails(getDoc(doc(other, "users/owner/armoryItems/weapon-1")));
    await assertFails(setDoc(doc(other, "users/owner/loadouts/loadout-2"), { ...loadout, id: "loadout-2" }));
  });

  it("accepts bow equipment kinds and weapon-type loadout slots", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const now = Timestamp.now();
    const bow = { id: "bow-1", ownerId: "owner", name: "Hoyt RX-7", kind: "weapon", weapon: { type: "bow", model: "Hoyt RX-7", bowType: "Compound" }, createdAt: now, updatedAt: now };
    const arrow = { id: "arrow-1", ownerId: "owner", name: "Easton Axis", kind: "arrow", detail: "300 spine", createdAt: now, updatedAt: now };
    const broadhead = { id: "broadhead-1", ownerId: "owner", name: "QAD Exodus", kind: "broadhead", grain: 100, createdAt: now, updatedAt: now };

    await assertSucceeds(setDoc(doc(owner, "users/owner/armoryItems/bow-1"), bow));
    await assertSucceeds(setDoc(doc(owner, "users/owner/armoryItems/arrow-1"), arrow));
    await assertSucceeds(setDoc(doc(owner, "users/owner/armoryItems/broadhead-1"), broadhead));
    // A broadhead without its grain fact is invalid.
    await assertFails(setDoc(doc(owner, "users/owner/armoryItems/broadhead-2"), { ...broadhead, id: "broadhead-2", grain: null }));

    const loadout = { id: "loadout-bow", ownerId: "owner", name: "Bow setup", weaponId: "bow-1", slots: { arrowId: "arrow-1", broadheadId: "broadhead-1" }, isDefault: false, createdAt: now, updatedAt: now };
    await assertSucceeds(setDoc(doc(owner, "users/owner/loadouts/loadout-bow"), loadout));
    await assertFails(setDoc(doc(owner, "users/owner/loadouts/loadout-bad"), { ...loadout, id: "loadout-bad", slots: { quiverId: "arrow-1" } }));
  });

  it("restricts the forum to signed-in hunters and document authors", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const stranger = environment.authenticatedContext("stranger").firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const now = Timestamp.now();
    const question = { id: "q1", authorId: "owner", authorName: "Owner", title: "Best .300 load for kudu?", body: "Looking for grain advice.", createdAt: now, updatedAt: now };
    const answer = { id: "a1", questionId: "q1", authorId: "other", authorName: "Other", body: "180gr bonded has worked for me.", createdAt: now, updatedAt: now };

    // Guests can neither post nor read; authors can only post as themselves.
    await assertFails(setDoc(doc(guest, "forumQuestions/q1"), question));
    await assertFails(setDoc(doc(other, "forumQuestions/q1"), question));
    // No answers under nonexistent questions, no future-dated feed pinning.
    await assertFails(setDoc(doc(other, "forumQuestions/ghost/answers/a0"), { ...answer, id: "a0", questionId: "ghost" }));
    await assertFails(setDoc(doc(owner, "forumQuestions/q1"), { ...question, createdAt: Timestamp.fromDate(new Date(Date.now() + 3_600_000)) }));
    await assertSucceeds(setDoc(doc(owner, "forumQuestions/q1"), question));
    await assertSucceeds(getDoc(doc(other, "forumQuestions/q1")));
    await assertFails(getDoc(doc(guest, "forumQuestions/q1")));

    // Only the question author can edit the question (including accepting an answer).
    await assertFails(setDoc(doc(other, "forumQuestions/q1"), { ...question, title: "Hijacked" }));
    await assertSucceeds(setDoc(doc(other, "forumQuestions/q1/answers/a1"), answer));
    await assertFails(setDoc(doc(owner, "forumQuestions/q1/answers/a2"), { ...answer, id: "a2" })); // wrong authorId
    await assertSucceeds(updateDoc(doc(owner, "forumQuestions/q1"), { acceptedAnswerId: "a1" }));
    await assertFails(updateDoc(doc(other, "forumQuestions/q1"), { acceptedAnswerId: "a1" }));

    // Answers are removable by their author or the question author, nobody else.
    await assertFails(deleteDoc(doc(stranger, "forumQuestions/q1/answers/a1")));
    await assertSucceeds(deleteDoc(doc(owner, "forumQuestions/q1/answers/a1")));
    await assertFails(deleteDoc(doc(other, "forumQuestions/q1")));
    await assertSucceeds(deleteDoc(doc(owner, "forumQuestions/q1")));
  });

  it("allows public reads but only owners can write public projections", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const now = Timestamp.now();
    const publicProfile = { id: "owner", displayName: "Owner", avatarUrl: null, bio: "", searchName: "owner", createdAt: now, updatedAt: now };
    await assertSucceeds(setDoc(doc(owner, "publicProfiles/owner"), publicProfile));
    await assertSucceeds(getDoc(doc(guest, "publicProfiles/owner")));
    await assertFails(setDoc(doc(other, "publicProfiles/owner"), publicProfile));
  });

  it("lets any signed-in user create an immutable community farm entry", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const now = Timestamp.now();
    const farmId = "baviaans-lodge_-33.02_27.90";
    const farm = {
      id: farmId,
      name: "Baviaans Lodge",
      searchName: "baviaans lodge",
      latitude: -33.0183,
      longitude: 27.9035,
      country: "South Africa",
      placeName: "Eastern Cape",
      createdBy: "owner",
      createdAt: now,
      updatedAt: now,
    };

    await assertFails(setDoc(doc(guest, `farms/${farmId}`), farm));
    await assertFails(setDoc(doc(other, `farms/${farmId}`), farm)); // createdBy must match author
    await assertFails(setDoc(doc(owner, `farms/${farmId}`), { ...farm, latitude: 123 }));
    await assertFails(setDoc(doc(owner, `farms/${farmId}`), { ...farm, extra: "field" }));
    await assertSucceeds(setDoc(doc(owner, `farms/${farmId}`), farm));
    await assertSucceeds(getDoc(doc(guest, `farms/${farmId}`)));
    // No client may move, rename, or delete a farm once created — not even its creator.
    await assertFails(updateDoc(doc(owner, `farms/${farmId}`), { name: "Renamed" }));
    await assertFails(setDoc(doc(other, `farms/${farmId}`), { ...farm, createdBy: "other" }));
    await assertFails(deleteDoc(doc(owner, `farms/${farmId}`)));
  });

  it("rejects a published hunt that references a nonexistent farm", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const now = Timestamp.now();
    const farmId = "baviaans-lodge_-33.02_27.90";
    const publicHunt = {
      id: "owner_kill-1",
      ownerId: "owner",
      sourceKillId: "kill-1",
      hunter: { id: "owner", displayName: "Owner", avatarUrl: null },
      species: "Greater Kudu",
      coverMediaId: null,
      media: [],
      country: "South Africa",
      date: "2025-06-12",
      killTime: "06:42",
      location: { latitude: -33.0183, longitude: 27.9035, placeName: "Eastern Cape", farmName: "Baviaans Lodge", farmId },
      weapon: { type: "rifle", model: "Sako S20", caliber: ".300 Win Mag" },
      ammunition: { grain: 180 },
      routeSummary: null,
      description: "",
      publishedAt: now,
      updatedAt: now,
    };

    await assertFails(setDoc(doc(owner, "publicHunts/owner_kill-1"), publicHunt));

    await assertSucceeds(setDoc(doc(owner, `farms/${farmId}`), {
      id: farmId,
      name: "Baviaans Lodge",
      searchName: "baviaans lodge",
      latitude: -33.0183,
      longitude: 27.9035,
      country: "South Africa",
      placeName: "Eastern Cape",
      createdBy: "owner",
      createdAt: now,
      updatedAt: now,
    }));
    await assertSucceeds(setDoc(doc(owner, "publicHunts/owner_kill-1"), publicHunt));
  });

  it("guards likes, comments, and notifications with strict authorship", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const stranger = environment.authenticatedContext("stranger").firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const now = Timestamp.now();
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "publicHunts/owner_kill-1"), { id: "owner_kill-1", ownerId: "owner" });
    });

    // Likes: only as yourself, only under an existing hunt; public read.
    const like = { huntId: "owner_kill-1", likerId: "other", likerName: "Other", createdAt: now };
    await assertFails(setDoc(doc(guest, "publicHunts/owner_kill-1/likes/other"), like));
    await assertFails(setDoc(doc(stranger, "publicHunts/owner_kill-1/likes/other"), like));
    await assertFails(setDoc(doc(other, "publicHunts/ghost/likes/other"), { ...like, huntId: "ghost" }));
    await assertSucceeds(setDoc(doc(other, "publicHunts/owner_kill-1/likes/other"), like));
    await assertSucceeds(getDoc(doc(guest, "publicHunts/owner_kill-1/likes/other")));

    // Notifications: spoofing without the backing action is rejected.
    const likeNotification = { id: "like_other_owner_kill-1", recipientId: "owner", actorId: "other", actorName: "Other", type: "like", huntId: "owner_kill-1", huntSpecies: "Greater Kudu", createdAt: now, readAt: null };
    await assertFails(setDoc(doc(stranger, "users/owner/notifications/like_stranger_owner_kill-1"), { ...likeNotification, id: "like_stranger_owner_kill-1", actorId: "stranger" }));
    await assertSucceeds(setDoc(doc(other, "users/owner/notifications/like_other_owner_kill-1"), likeNotification));

    // Only the recipient reads and marks read; the actor may retract.
    await assertFails(getDoc(doc(other, "users/owner/notifications/like_other_owner_kill-1")));
    await assertSucceeds(getDoc(doc(owner, "users/owner/notifications/like_other_owner_kill-1")));
    await assertFails(updateDoc(doc(owner, "users/owner/notifications/like_other_owner_kill-1"), { actorName: "Hacked" }));
    await assertSucceeds(updateDoc(doc(owner, "users/owner/notifications/like_other_owner_kill-1"), { readAt: now }));
    await assertFails(deleteDoc(doc(stranger, "users/owner/notifications/like_other_owner_kill-1")));
    await assertSucceeds(deleteDoc(doc(other, "users/owner/notifications/like_other_owner_kill-1")));
    await assertSucceeds(deleteDoc(doc(other, "publicHunts/owner_kill-1/likes/other")));

    // Comments: author-only writes; the hunt owner moderates.
    const comment = { id: "c1", huntId: "owner_kill-1", authorId: "other", authorName: "Other", body: "Great kudu.", createdAt: now, updatedAt: now };
    await assertFails(setDoc(doc(stranger, "publicHunts/owner_kill-1/comments/c1"), comment));
    await assertSucceeds(setDoc(doc(other, "publicHunts/owner_kill-1/comments/c1"), comment));
    await assertSucceeds(getDoc(doc(guest, "publicHunts/owner_kill-1/comments/c1")));
    await assertFails(deleteDoc(doc(stranger, "publicHunts/owner_kill-1/comments/c1")));
    await assertSucceeds(deleteDoc(doc(owner, "publicHunts/owner_kill-1/comments/c1")));
  });

  it("creates the follow notification atomically with the follow edge", async () => {
    const other = environment.authenticatedContext("other").firestore();
    const stranger = environment.authenticatedContext("stranger").firestore();
    const now = Timestamp.now();
    const edge = { followerId: "other", followedId: "owner", createdAt: now };
    const followNotification = { id: "follow_other", recipientId: "owner", actorId: "other", actorName: "Other", type: "follow", createdAt: now, readAt: null };

    const batch = writeBatch(other);
    batch.set(doc(other, "users/other/following/owner"), edge);
    batch.set(doc(other, "publicFollowers/owner/followers/other"), edge);
    batch.set(doc(other, "users/owner/notifications/follow_other"), followNotification);
    await assertSucceeds(batch.commit());

    // A follow notification without the follow edge is a spoof.
    await assertFails(setDoc(doc(stranger, "users/owner/notifications/follow_stranger"), { ...followNotification, id: "follow_stranger", actorId: "stranger" }));
  });

  it("allows users to follow only as themselves", async () => {
    const owner = environment.authenticatedContext("owner").firestore();
    const other = environment.authenticatedContext("other").firestore();
    const guest = environment.unauthenticatedContext().firestore();
    const edge = { followerId: "owner", followedId: "other", createdAt: Timestamp.now() };
    await assertSucceeds(setDoc(doc(owner, "users/owner/following/other"), edge));
    await assertSucceeds(setDoc(doc(owner, "publicFollowers/other/followers/owner"), edge));
    await assertFails(setDoc(doc(other, "users/owner/following/intruder"), { ...edge, followedId: "intruder" }));
    // The public follow graph is readable via collection-group queries, so a
    // profile can list who a hunter follows.
    await assertSucceeds(getDocs(query(collectionGroup(guest, "followers"), where("followerId", "==", "owner"))));
  });
});
