import { readFileSync } from "node:fs";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadBytes } from "firebase/storage";

const projectId = "hunta-storage-rules";

describe("Storage ownership rules", () => {
  let environment: RulesTestEnvironment;

  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId,
      storage: {
        rules: readFileSync("storage.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await environment.cleanup();
  });

  it("allows an owner to upload and read supported media", async () => {
    const storage = environment.authenticatedContext("owner").storage();
    const media = ref(
      storage,
      "users/owner/kills/kill-1/media/media-1-kudu.jpg",
    );

    await assertSucceeds(
      uploadBytes(media, new Uint8Array([1, 2, 3]), {
        contentType: "image/jpeg",
      }),
    );
    await assertSucceeds(getBytes(media));
  });

  it("denies cross-user and unauthenticated access", async () => {
    const other = environment.authenticatedContext("other").storage();
    const guest = environment.unauthenticatedContext().storage();
    const path = "users/owner/kills/kill-1/media/media-1-kudu.jpg";

    await assertFails(
      uploadBytes(ref(other, path), new Uint8Array([1]), {
        contentType: "image/jpeg",
      }),
    );
    await assertFails(getBytes(ref(guest, path)));
  });

  it("rejects unsupported media and oversized images", async () => {
    const storage = environment.authenticatedContext("owner").storage();
    const base = "users/owner/kills/kill-1/media";

    await assertFails(
      uploadBytes(ref(storage, `${base}/payload.html`), new Uint8Array([1]), {
        contentType: "text/html",
      }),
    );
    await assertFails(
      uploadBytes(
        ref(storage, `${base}/large.jpg`),
        new Uint8Array(15 * 1024 * 1024 + 1),
        { contentType: "image/jpeg" },
      ),
    );
  });

  it("accepts GPX only in the route path with an allowed type", async () => {
    const storage = environment.authenticatedContext("owner").storage();
    const route = ref(
      storage,
      "users/owner/kills/kill-1/routes/route-1.gpx",
    );

    await assertSucceeds(
      uploadBytes(route, new TextEncoder().encode("<gpx></gpx>"), {
        contentType: "application/gpx+xml",
      }),
    );
    await assertFails(
      uploadBytes(
        ref(storage, "users/owner/kills/kill-1/routes/route-1.txt"),
        new TextEncoder().encode("<gpx></gpx>"),
        { contentType: "text/plain" },
      ),
    );
  });
});
