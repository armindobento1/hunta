import { parseLocationCandidates, searchLocations } from "@/lib/location/search-locations";

describe("location search", () => {
  it("parses factual Esri candidates into farm search results", () => {
    expect(parseLocationCandidates({ candidates: [{ address: "Welgevonden Game Reserve", score: 100, location: { x: 27.8473, y: -24.386 }, attributes: { Match_addr: "Welgevonden Game Reserve, Limpopo", Country: "ZAF", Region: "Limpopo", MatchID: "farm-1" } }] })).toEqual([{
      id: "farm-1", label: "Welgevonden Game Reserve", context: "Welgevonden Game Reserve, Limpopo",
      country: "ZAF", region: "Limpopo", latitude: -24.386, longitude: 27.8473,
    }]);
  });

  it("passes an AbortSignal to an encoded forward-geocoding request", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });
    const controller = new AbortController();
    await searchLocations("Baviaans Lodge", { signal: controller.signal, fetcher });
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("SingleLine=Baviaans+Lodge"), expect.objectContaining({ signal: controller.signal }));
  });
});
