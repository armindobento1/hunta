import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KillForm } from "@/components/kills/kill-form";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

describe("KillForm", () => {
  it("blocks save until factual fields and a cover photo are present", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderWithRouter(<KillForm onSave={onSave} />);

    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    expect(await screen.findByText(/species is required/i)).toBeInTheDocument();
    expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/kill time is required/i)).toBeInTheDocument();
    expect(screen.getByText(/farm name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/cover photo is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits the required farm and optional measurement facts", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(<KillForm initialKill={makeKill()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/farm name/i), "Baviaans Lodge");
    await user.type(screen.getByLabelText(/^score \/ size$/i), "56.875");
    await user.type(screen.getByLabelText(/^dressed weight$/i), "241");
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0]).toMatchObject({
      farmName: "Baviaans Lodge",
      measureScore: 56.875,
      measureScoreUnit: "in",
      measureScoringSystem: "SCI",
      measureWeightDressed: 241,
      measureWeightUnit: "kg",
    });
  });

  it("shows the correct weapon facts for rifle and bow", async () => {
    const user = userEvent.setup();
    renderWithRouter(<KillForm onSave={vi.fn()} />);

    expect(screen.getByLabelText(/caliber/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/weapon type/i), "bow");

    expect(screen.queryByLabelText(/caliber/i)).toBeNull();
    expect(screen.getByLabelText(/bow type/i)).toBeInTheDocument();
  });

  it("prefills a hunt snapshot from a saved armory loadout", async () => {
    const user = userEvent.setup();
    const now = "2025-06-12T08:00:00.000Z";
    const common = { ownerId: "owner-1", createdAt: now, updatedAt: now };
    const items = [
      { ...common, id: "weapon-1", name: "Sako S20", kind: "weapon" as const, weapon: { type: "rifle" as const, model: "Sako S20", caliber: ".300 Win Mag" } },
      { ...common, id: "optic-1", name: "Swarovski Z8i", kind: "optic" as const },
      { ...common, id: "ammo-1", name: "Norma Bondstrike", kind: "ammunition" as const, grain: 180 },
    ];
    const loadouts = [{ ...common, id: "loadout-1", name: "Kudu setup", weaponId: "weapon-1", slots: { opticId: "optic-1", ammunitionId: "ammo-1" }, isDefault: true }];
    renderWithRouter(<KillForm onSave={vi.fn()} armoryItems={items} loadouts={loadouts} />);

    await user.selectOptions(screen.getByLabelText(/saved loadout/i), "loadout-1");

    expect(screen.getByLabelText(/weapon model/i)).toHaveValue("Sako S20");
    expect(screen.getByLabelText(/caliber/i)).toHaveValue(".300 Win Mag");
    expect(screen.getByLabelText(/^optic$/i)).toHaveValue("Swarovski Z8i");
    expect(screen.getByLabelText(/grain/i)).toHaveValue(180);
  });

  it("warns before publishing a farm and exact coordinates", async () => {
    const user = userEvent.setup();
    renderWithRouter(<KillForm onSave={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /publish publicly/i }));
    expect(screen.getByText(/farm name and exact gps coordinates will be visible to everyone/i)).toBeInTheDocument();
  });

  it("accepts supported media and chooses the first photo as cover", async () => {
    const user = userEvent.setup();
    renderWithRouter(<KillForm onSave={vi.fn()} />);
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
    renderWithRouter(<KillForm initialKill={makeKill()} onSave={onSave} />);

    expect(screen.getByLabelText(/species/i)).toHaveValue("Greater Kudu");
    await user.type(screen.getByLabelText(/farm name/i), "Baviaans Lodge");
    await user.clear(screen.getByRole("textbox", { name: /hunt story/i }));
    await user.type(
      screen.getByRole("textbox", { name: /hunt story/i }),
      "Updated story",
    );
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
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
    renderWithRouter(<KillForm onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /use current position/i }));

    expect(screen.getByLabelText(/latitude/i)).toHaveValue(-33.01);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(27.91);
  });
});
