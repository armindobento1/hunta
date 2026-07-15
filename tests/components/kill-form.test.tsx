import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KillForm } from "@/components/kills/kill-form";
import { KillEditor } from "@/components/kills/kill-editor";
import type { ArmoryItem, Loadout } from "@/lib/domain/armory";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

const repositoryMocks = vi.hoisted(() => ({
  getKill: vi.fn(),
  saveKill: vi.fn(),
}));
const storageMocks = vi.hoisted(() => ({
  deleteStorageObject: vi.fn(),
  uploadGpx: vi.fn(),
  uploadMedia: vi.fn(),
}));
const hookMocks = vi.hoisted(() => ({
  useArmory: vi.fn<() => { items: ArmoryItem[]; loadouts: Loadout[] }>(() => ({
    items: [],
    loadouts: [],
  })),
}));

vi.mock("@/lib/firebase/kill-repository", () => repositoryMocks);
vi.mock("@/lib/firebase/storage-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/firebase/storage-repository")>()),
  ...storageMocks,
}));
vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "owner-1" } }),
}));
vi.mock("@/lib/hooks/use-armory", () => ({
  useArmory: hookMocks.useArmory,
}));
vi.mock("@/lib/hooks/use-profile", () => ({
  useProfile: () => ({ profile: null }),
}));

vi.mock("@/components/map/location-picker-map", () => ({
  LocationPickerMap: ({ onPick }: { onPick(latitude: number, longitude: number): void }) => (
    <button type="button" onClick={() => onPick(-32.51234, 26.25678)}>
      Simulate pin drop
    </button>
  ),
}));

vi.mock("@/lib/location/search-locations", () => ({
  searchLocations: vi.fn().mockResolvedValue([
    {
      id: "loc-1",
      label: "Graaff-Reinet",
      context: "Eastern Cape, South Africa",
      country: "South Africa",
      region: "Eastern Cape",
      latitude: -32.25,
      longitude: 24.55,
    },
  ]),
}));

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
    expect(screen.getByLabelText(/farm name \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByText(/cover photo is required/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits the required farm and optional measurement facts", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithRouter(<KillForm initialKill={makeKill()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/farm name/i), "Baviaans Lodge");
    await user.selectOptions(screen.getByLabelText(/^score \/ size$/i), "56");
    await user.selectOptions(screen.getByLabelText(/eighths of an inch/i), "7");
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

  it("prefills arrow and broadhead names from a bow loadout", async () => {
    const user = userEvent.setup();
    const now = "2025-06-12T08:00:00.000Z";
    const common = { ownerId: "owner-1", createdAt: now, updatedAt: now };
    const items = [
      {
        ...common,
        id: "bow-1",
        name: "Hoyt RX-7",
        kind: "weapon" as const,
        weapon: {
          type: "bow" as const,
          model: "Hoyt RX-7",
          bowType: "Compound",
        },
      },
      {
        ...common,
        id: "arrow-1",
        name: "Easton Axis",
        kind: "arrow" as const,
      },
      {
        ...common,
        id: "broadhead-1",
        name: "QAD Exodus",
        kind: "broadhead" as const,
        grain: 100,
      },
    ];
    const loadouts = [
      {
        ...common,
        id: "loadout-bow",
        name: "Bow setup",
        weaponId: "bow-1",
        slots: { arrowId: "arrow-1", broadheadId: "broadhead-1" },
        isDefault: false,
      },
    ];
    renderWithRouter(
      <KillForm onSave={vi.fn()} armoryItems={items} loadouts={loadouts} />,
    );

    await user.selectOptions(
      screen.getByLabelText(/saved loadout/i),
      "loadout-bow",
    );

    expect(screen.getByLabelText(/^arrow$/i)).toHaveValue("Easton Axis");
    expect(screen.getByLabelText(/^broadhead$/i)).toHaveValue("QAD Exodus");
  });

  it("offers no public publishing in the private-only build", () => {
    // VITE_SOCIAL_ENABLED is off, so the publish toggle must not render —
    // audit v1.1 F-01/F-05 containment.
    renderWithRouter(<KillForm onSave={vi.fn()} />);
    expect(screen.queryByRole("checkbox", { name: /publish publicly/i })).toBeNull();
    expect(screen.queryByText(/publish publicly/i)).toBeNull();
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

  it("drops a map pin without touching the typed farm name", async () => {
    const user = userEvent.setup();
    renderWithRouter(<KillForm onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/farm name/i), "Karreekloof");
    await user.click(screen.getByRole("button", { name: /simulate pin drop/i }));

    expect(screen.getByText(/pin at -32\.51234, 26\.25678/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/farm name/i)).toHaveValue("Karreekloof");
  });

  it("search jump moves the pin but never overwrites the farm name", async () => {
    const user = userEvent.setup();
    renderWithRouter(<KillForm onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/farm name/i), "Karreekloof");
    await user.type(
      screen.getByLabelText(/jump map to a town or region/i),
      "Graaff",
    );
    await user.click(await screen.findByRole("option", { name: /graaff-reinet/i }));

    expect(screen.getByLabelText(/farm name/i)).toHaveValue("Karreekloof");
    expect(screen.getByText(/pin at -32\.25000, 24\.55000/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/place name/i)).toHaveValue("Eastern Cape, South Africa");
    expect(screen.getByLabelText(/country/i)).toHaveValue("South Africa");
  });

  it("suggests nearby community farms after a pin drop and adopts the chosen one", async () => {
    const user = userEvent.setup();
    const now = "2025-06-12T08:00:00.000Z";
    const findNearbyFarms = vi.fn().mockResolvedValue([
      {
        farm: {
          id: "baviaans-lodge_-32.51_26.26",
          name: "Baviaans Lodge",
          searchName: "baviaans lodge",
          latitude: -32.512,
          longitude: 26.257,
          country: "South Africa",
          placeName: "Eastern Cape",
          createdBy: "someone-else",
          createdAt: now,
          updatedAt: now,
        },
        distanceKm: 0.4,
      },
    ]);
    renderWithRouter(<KillForm onSave={vi.fn()} findNearbyFarms={findNearbyFarms} />);

    await user.click(screen.getByRole("button", { name: /simulate pin drop/i }));
    await user.click(await screen.findByRole("button", { name: /baviaans lodge/i }));

    expect(screen.getByLabelText(/farm name/i)).toHaveValue("Baviaans Lodge");
    expect(findNearbyFarms).toHaveBeenCalledWith("", -32.51234, 26.25678);

    // Typing a different farm name breaks the community-farm link.
    await user.type(screen.getByLabelText(/farm name/i), " Annex");
    expect(screen.getByLabelText(/farm name/i)).toHaveValue("Baviaans Lodge Annex");
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

describe("KillEditor persistence", () => {
  beforeEach(() => {
    repositoryMocks.getKill.mockReset();
    repositoryMocks.saveKill.mockReset().mockResolvedValue(undefined);
    storageMocks.deleteStorageObject.mockReset().mockResolvedValue(undefined);
    storageMocks.uploadGpx.mockReset();
    storageMocks.uploadMedia.mockReset();
    hookMocks.useArmory.mockReturnValue({ items: [], loadouts: [] });
  });

  it("clears loadout, attachments, and measurements and omits a blank farm", async () => {
    const user = userEvent.setup();
    repositoryMocks.getKill.mockResolvedValue(
      makeKill({
        loadoutId: "loadout-1",
        equipmentAttachments: {
          optic: { name: "Swarovski Z8i" },
          sling: { name: "Niggeloh" },
        },
        measurement: {
          score: 54.125,
          scoreUnit: "in",
          scoringSystem: "SCI",
          weightDressed: 241,
          weightUnit: "kg",
        },
      }),
    );
    renderWithRouter(<KillEditor killId="kill-1" />);

    await screen.findByRole("heading", { name: /edit hunt record/i });
    await user.selectOptions(screen.getByLabelText(/saved loadout/i), "");
    await user.clear(screen.getByLabelText(/^optic$/i));
    await user.clear(screen.getByLabelText(/^sling$/i));
    await user.selectOptions(screen.getByLabelText(/^score \/ size$/i), "");
    await user.clear(screen.getByLabelText(/^dressed weight$/i));
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    await waitFor(() => expect(repositoryMocks.saveKill).toHaveBeenCalledOnce());
    const saved = repositoryMocks.saveKill.mock.calls[0][0];
    expect(saved).not.toHaveProperty("loadoutId");
    expect(saved).not.toHaveProperty("equipmentAttachments");
    expect(saved).not.toHaveProperty("measurement");
    expect(saved.location).not.toHaveProperty("farmName");
  });

  it("persists bow loadout attachment names", async () => {
    const user = userEvent.setup();
    const now = "2025-06-12T08:00:00.000Z";
    const common = { ownerId: "owner-1", createdAt: now, updatedAt: now };
    const items = [
      {
        ...common,
        id: "bow-1",
        name: "Hoyt RX-7",
        kind: "weapon" as const,
        weapon: {
          type: "bow" as const,
          model: "Hoyt RX-7",
          bowType: "Compound",
        },
      },
      {
        ...common,
        id: "arrow-1",
        name: "Easton Axis",
        kind: "arrow" as const,
      },
      {
        ...common,
        id: "broadhead-1",
        name: "QAD Exodus",
        kind: "broadhead" as const,
        grain: 100,
      },
    ];
    const loadouts = [
      {
        ...common,
        id: "loadout-bow",
        name: "Bow setup",
        weaponId: "bow-1",
        slots: { arrowId: "arrow-1", broadheadId: "broadhead-1" },
        isDefault: false,
      },
    ];
    hookMocks.useArmory.mockReturnValue({ items, loadouts });
    repositoryMocks.getKill.mockResolvedValue(makeKill());
    renderWithRouter(<KillEditor killId="kill-1" />);

    await screen.findByRole("heading", { name: /edit hunt record/i });
    await user.selectOptions(
      screen.getByLabelText(/saved loadout/i),
      "loadout-bow",
    );
    await user.type(screen.getByLabelText(/grain/i), "400");
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    await waitFor(() => expect(repositoryMocks.saveKill).toHaveBeenCalledOnce());
    expect(repositoryMocks.saveKill.mock.calls[0][0]).toMatchObject({
      loadoutId: "loadout-bow",
      equipmentAttachments: {
        arrow: { name: "Easton Axis" },
        broadhead: { name: "QAD Exodus" },
      },
    });
  });

  it("does not persist stale bow attachments after switching to rifle", async () => {
    const user = userEvent.setup();
    repositoryMocks.getKill.mockResolvedValue(
      makeKill({
        weapon: {
          type: "bow",
          model: "Hoyt RX-7",
          bowType: "Compound",
        },
        equipmentAttachments: {
          arrow: { name: "Easton Axis" },
          broadhead: { name: "QAD Exodus" },
        },
      }),
    );
    renderWithRouter(<KillEditor killId="kill-1" />);

    await screen.findByRole("heading", { name: /edit hunt record/i });
    await user.selectOptions(screen.getByLabelText(/weapon type/i), "rifle");
    await user.type(screen.getByLabelText(/caliber/i), ".308 Win");
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    await waitFor(() => expect(repositoryMocks.saveKill).toHaveBeenCalledOnce());
    expect(repositoryMocks.saveKill.mock.calls[0][0]).not.toHaveProperty(
      "equipmentAttachments",
    );
  });

  it("deletes removed media and a replaced route only after the edit save resolves", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn(() => true));
    const replacement = {
      ...makeKill().media[0],
      id: "media-2",
      storagePath: "users/owner-1/kills/kill-1/media/media-2.jpg",
      downloadUrl: "https://example.com/media-2.jpg",
      fileName: "follow-up.jpg",
    };
    const initial = makeKill({ media: [...makeKill().media, replacement] });
    repositoryMocks.getKill.mockResolvedValue(initial);
    let resolveSave!: () => void;
    repositoryMocks.saveKill.mockImplementation(
      () => new Promise<void>((resolve) => { resolveSave = resolve; }),
    );
    storageMocks.uploadGpx.mockResolvedValue({
      parsed: {},
      route: {
        ...initial.route!,
        storagePath: "users/owner-1/kills/kill-1/routes/new-route.gpx",
        fileName: "replacement.gpx",
      },
    });
    renderWithRouter(<KillEditor killId="kill-1" />);

    await screen.findByRole("heading", { name: /edit hunt record/i });
    await user.click(screen.getByRole("button", { name: /remove kudu\.jpg/i }));
    await user.upload(
      screen.getByLabelText(/morning-stalk\.gpx/i),
      new File(
        ["<gpx><trk><trkseg><trkpt lat=\"0\" lon=\"0\"/></trkseg></trk></gpx>"],
        "replacement.gpx",
        { type: "application/gpx+xml" },
      ),
    );
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    await waitFor(() => expect(repositoryMocks.saveKill).toHaveBeenCalledOnce());
    expect(storageMocks.deleteStorageObject).not.toHaveBeenCalled();
    resolveSave();
    await waitFor(() =>
      expect(storageMocks.deleteStorageObject).toHaveBeenCalledTimes(2),
    );

    expect(storageMocks.deleteStorageObject.mock.calls.map(([path]) => path)).toEqual([
      initial.media[0].storagePath,
      initial.route!.storagePath,
    ]);
    expect(repositoryMocks.saveKill.mock.invocationCallOrder[0]).toBeLessThan(
      storageMocks.deleteStorageObject.mock.invocationCallOrder[0],
    );
  });

  it("deletes only this attempt's uploads when the edit save fails", async () => {
    const user = userEvent.setup();
    const initial = makeKill();
    repositoryMocks.getKill.mockResolvedValue(initial);
    repositoryMocks.saveKill.mockRejectedValue(new Error("Save failed"));
    storageMocks.uploadMedia.mockImplementation(async ({ id, file }) => ({
      id,
      kind: "photo",
      storagePath: "users/owner-1/kills/kill-1/media/new-upload.jpg",
      downloadUrl: "https://example.com/new-upload.jpg",
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      createdAt: "2025-06-12T08:00:00.000Z",
    }));
    storageMocks.uploadGpx.mockResolvedValue({
      parsed: {},
      route: {
        ...initial.route!,
        storagePath: "users/owner-1/kills/kill-1/routes/new-upload.gpx",
        fileName: "new-upload.gpx",
      },
    });
    renderWithRouter(<KillEditor killId="kill-1" />);

    await screen.findByRole("heading", { name: /edit hunt record/i });
    await user.upload(
      screen.getByLabelText(/add photos or videos/i),
      new File([new Uint8Array([1])], "new-upload.jpg", { type: "image/jpeg" }),
    );
    await user.upload(
      screen.getByLabelText(/morning-stalk\.gpx/i),
      new File(
        ["<gpx><trk><trkseg><trkpt lat=\"0\" lon=\"0\"/></trkseg></trk></gpx>"],
        "new-upload.gpx",
        { type: "application/gpx+xml" },
      ),
    );
    await user.click(
      screen.getAllByRole("button", { name: /save hunt record/i }).at(-1)!,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
    expect(storageMocks.deleteStorageObject.mock.calls.map(([path]) => path)).toEqual([
      "users/owner-1/kills/kill-1/media/new-upload.jpg",
      "users/owner-1/kills/kill-1/routes/new-upload.gpx",
    ]);
    expect(storageMocks.deleteStorageObject).not.toHaveBeenCalledWith(
      initial.media[0].storagePath,
    );
    expect(storageMocks.deleteStorageObject).not.toHaveBeenCalledWith(
      initial.route!.storagePath,
    );
  });
});
