import { readFileSync } from "node:fs";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";

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

  it.each([
    ["media", "media-2-kudu.jpg", "image/jpeg"],
    ["routes", "route-2.gpx", "application/gpx+xml"],
  ])("allows only the owner to delete kill %s", async (folder, fileName, contentType) => {
    const owner = environment.authenticatedContext("delete-owner").storage();
    const other = environment.authenticatedContext("other").storage();
    const guest = environment.unauthenticatedContext().storage();
    const path = `users/delete-owner/kills/kill-2/${folder}/${fileName}`;
    const bytes =
      folder === "routes"
        ? new TextEncoder().encode("<gpx></gpx>")
        : new Uint8Array([1, 2, 3]);

    await assertSucceeds(
      uploadBytes(ref(owner, path), bytes, { contentType }),
    );
    await assertFails(deleteObject(ref(other, path)));
    await assertFails(deleteObject(ref(guest, path)));
    await assertSucceeds(deleteObject(ref(owner, path)));
  });

  it("denies avatar deletion to everyone, including the owner", async () => {
    const owner = environment.authenticatedContext("avatar-owner").storage();
    const other = environment.authenticatedContext("other").storage();
    const guest = environment.unauthenticatedContext().storage();
    const path = "users/avatar-owner/avatars/avatar.jpg";

    await assertSucceeds(
      uploadBytes(ref(owner, path), new Uint8Array([1, 2, 3]), {
        contentType: "image/jpeg",
      }),
    );
    await assertFails(deleteObject(ref(other, path)));
    await assertFails(deleteObject(ref(guest, path)));
    await assertFails(deleteObject(ref(owner, path)));
  });
});
