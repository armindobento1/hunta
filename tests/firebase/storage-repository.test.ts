import {
  sanitizeFileName,
  validateGpxFile,
  validateMediaFile,
} from "@/lib/firebase/storage-repository";

describe("storage file policy", () => {
  it("sanitizes upload names without losing the extension", () => {
    expect(sanitizeFileName("  My Kudu (Final).JPG  ")).toBe(
      "my-kudu-final.jpg",
    );
  });

  it("accepts supported photo and video files within limits", () => {
    const photo = new File([new Uint8Array(100)], "kudu.jpg", {
      type: "image/jpeg",
    });
    const video = new File([new Uint8Array(100)], "stalk.mp4", {
      type: "video/mp4",
    });

    expect(validateMediaFile(photo)).toEqual({ kind: "photo" });
    expect(validateMediaFile(video)).toEqual({ kind: "video" });
  });

  it("rejects unsupported media and empty files", () => {
    const html = new File(["<script></script>"], "payload.html", {
      type: "text/html",
    });
    const empty = new File([], "empty.jpg", { type: "image/jpeg" });

    expect(() => validateMediaFile(html)).toThrow(/photo or video/i);
    expect(() => validateMediaFile(empty)).toThrow(/empty/i);
  });

  it("requires a GPX extension and enforces its size limit", () => {
    const route = new File(["<gpx></gpx>"], "route.gpx", {
      type: "application/gpx+xml",
    });
    const wrongExtension = new File(["<gpx></gpx>"], "route.xml", {
      type: "application/xml",
    });

    expect(validateGpxFile(route)).toBeUndefined();
    expect(() => validateGpxFile(wrongExtension)).toThrow(/\.gpx/i);
  });
});
