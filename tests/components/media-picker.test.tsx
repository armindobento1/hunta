import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { MediaPicker } from "@/components/kills/media-picker";
import type { PendingMedia } from "@/components/kills/types";
import type { MediaAsset } from "@/lib/domain/kill";

function mediaAsset(id: string, kind: "photo" | "video" = "photo"): MediaAsset {
  return {
    id,
    kind,
    storagePath: `users/owner-1/kills/kill-1/media/${id}.jpg`,
    downloadUrl: `https://example.com/${id}.jpg`,
    fileName: `${id}.jpg`,
    contentType: kind === "photo" ? "image/jpeg" : "video/mp4",
    sizeBytes: 3,
    createdAt: "2025-06-12T04:40:00.000Z",
  };
}

describe("MediaPicker", () => {
  it("rejects a selection that would push the record past 30 media items", async () => {
    const user = userEvent.setup();
    const onNewChange = vi.fn();
    render(
      <MediaPicker
        existingMedia={Array.from({ length: 30 }, (_, index) =>
          mediaAsset(`media-${index}`),
        )}
        newMedia={[]}
        coverMediaId="media-0"
        onExistingChange={vi.fn()}
        onNewChange={onNewChange}
        onCoverChange={vi.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText(/add photos or videos/i),
      new File([new Uint8Array([1])], "overflow.jpg", { type: "image/jpeg" }),
    );

    expect(
      screen.getByText("A record can hold up to 30 photos and videos."),
    ).toBeInTheDocument();
    expect(onNewChange).not.toHaveBeenCalled();
  });

  it("assigns the first remaining photo when the cover is removed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn(() => true));

    function Harness() {
      const [existingMedia, setExistingMedia] = useState([
        mediaAsset("cover"),
        mediaAsset("video", "video"),
        mediaAsset("replacement"),
      ]);
      const [newMedia, setNewMedia] = useState<PendingMedia[]>([
        {
          id: "pending-photo",
          kind: "photo",
          file: new File([new Uint8Array([1])], "pending.jpg", {
            type: "image/jpeg",
          }),
        },
      ]);
      const [coverMediaId, setCoverMediaId] = useState<string | null>("cover");

      return (
        <MediaPicker
          existingMedia={existingMedia}
          newMedia={newMedia}
          coverMediaId={coverMediaId}
          onExistingChange={setExistingMedia}
          onNewChange={setNewMedia}
          onCoverChange={setCoverMediaId}
        />
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /remove cover\.jpg/i }));

    expect(
      screen.getByRole("radio", { name: /use replacement\.jpg as cover/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /use pending\.jpg as cover/i }),
    ).not.toBeChecked();
  });
});
