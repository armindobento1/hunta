import { killSchema } from "@/lib/domain/kill";
import { makeKill } from "@/tests/helpers/kill";

describe("killSchema", () => {
  it.each(["species", "country", "date", "killTime"] as const)(
    "rejects a missing required fact: %s",
    (field) => {
      const kill = makeKill({ [field]: "" });
      expect(killSchema.safeParse(kill).success).toBe(false);
    },
  );

  it("rejects an active kill without an exact location", () => {
    const kill = makeKill({
      location: { latitude: Number.NaN, longitude: 27.9, placeName: "" },
    });
    expect(killSchema.safeParse(kill).success).toBe(false);
  });

  it("requires caliber for rifle records", () => {
    const kill = makeKill({
      weapon: { type: "rifle", model: "Sako S20", caliber: "" },
    });
    expect(killSchema.safeParse(kill).success).toBe(false);
  });

  it("requires bow type for bow records", () => {
    const kill = makeKill({
      weapon: { type: "bow", model: "Hoyt RX-8", bowType: "" },
    });
    expect(killSchema.safeParse(kill).success).toBe(false);
  });

  it("rejects a cover reference that is not in media", () => {
    const kill = makeKill({ coverMediaId: "missing-media" });
    expect(killSchema.safeParse(kill).success).toBe(false);
  });

  it("accepts a recoverable draft while media is still uploading", () => {
    const draft = makeKill({ status: "draft", coverMediaId: null, media: [] });
    expect(killSchema.safeParse(draft).success).toBe(true);
  });

  it("rejects non-positive ammunition grain", () => {
    const kill = makeKill({ ammunition: { grain: 0 } });
    expect(killSchema.safeParse(kill).success).toBe(false);
  });

  it("rejects attachments linked to another owner or record", () => {
    const hostileMedia = makeKill({
      media: [
        {
          ...makeKill().media[0],
          storagePath: "users/other/kills/kill-9/media/stolen.jpg",
        },
      ],
    });
    const hostileRoute = makeKill({
      route: {
        ...makeKill().route!,
        storagePath: "users/other/kills/kill-9/routes/stolen.gpx",
      },
    });

    expect(killSchema.safeParse(hostileMedia).success).toBe(false);
    expect(killSchema.safeParse(hostileRoute).success).toBe(false);
  });
});
