import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KillForm } from "@/components/kills/kill-form";
import { makeKill } from "@/tests/helpers/kill";

describe("KillForm", () => {
  it("blocks save until factual fields and a cover photo are present", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<KillForm onSave={onSave} />);

    await user.click(
      screen.getAllByRole("button", { name: /save fieldnote/i }).at(-1)!,
    );

    expect(await screen.findByText(/species is required/i)).toBeInTheDocument();
    expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/kill time is required/i)).toBeInTheDocument();
    expect(screen.getByText(/cover photo is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("shows the correct weapon facts for rifle and bow", async () => {
    const user = userEvent.setup();
    render(<KillForm onSave={vi.fn()} />);

    expect(screen.getByLabelText(/caliber/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/weapon type/i), "bow");

    expect(screen.queryByLabelText(/caliber/i)).toBeNull();
    expect(screen.getByLabelText(/bow type/i)).toBeInTheDocument();
  });

  it("accepts supported media and chooses the first photo as cover", async () => {
    const user = userEvent.setup();
    render(<KillForm onSave={vi.fn()} />);
    const photo = new File([new Uint8Array([1, 2, 3])], "kudu.jpg", {
      type: "image/jpeg",
    });

    await user.upload(screen.getByLabelText(/add photos or videos/i), photo);

    expect(screen.getByText("kudu.jpg")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /use kudu.jpg as cover/i })).toBeChecked();
  });

  it("prefills edit facts and preserves existing attachments on save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<KillForm initialKill={makeKill()} onSave={onSave} />);

    expect(screen.getByLabelText(/species/i)).toHaveValue("Greater Kudu");
    await user.clear(screen.getByRole("textbox", { name: /hunt story/i }));
    await user.type(
      screen.getByRole("textbox", { name: /hunt story/i }),
      "Updated story",
    );
    await user.click(
      screen.getAllByRole("button", { name: /save fieldnote/i }).at(-1)!,
    );

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      description: "Updated story",
      coverMediaId: "media-1",
      existingMedia: makeKill().media,
    });
  });

  it("fills coordinates only after current-position permission succeeds", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: -33.01, longitude: 27.91 } }),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });
    render(<KillForm onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /use current position/i }));

    expect(screen.getByLabelText(/latitude/i)).toHaveValue(-33.01);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(27.91);
  });
});
