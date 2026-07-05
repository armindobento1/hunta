export interface LocationSearchResult {
  id: string;
  label: string;
  context: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
}

interface EsriCandidate {
  address?: string;
  location?: { x?: number; y?: number };
  attributes?: Record<string, unknown>;
}

export function parseLocationCandidates(value: unknown): LocationSearchResult[] {
  const candidates = (value as { candidates?: EsriCandidate[] })?.candidates;
  if (!Array.isArray(candidates)) return [];
  return candidates.flatMap((candidate, index) => {
    const longitude = candidate.location?.x;
    const latitude = candidate.location?.y;
    if (!candidate.address || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];
    const attributes = candidate.attributes ?? {};
    return [{
      id: String(attributes.MatchID || `${candidate.address}-${index}`), label: candidate.address,
      context: String(attributes.Match_addr || candidate.address), country: String(attributes.Country || ""),
      region: String(attributes.Region || ""), latitude: latitude!, longitude: longitude!,
    }];
  });
}

type Fetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function searchLocations(
  query: string,
  { signal, fetcher = fetch }: { signal?: AbortSignal; fetcher?: Fetcher } = {},
): Promise<LocationSearchResult[]> {
  const endpoint = import.meta.env.VITE_GEOCODING_URL || "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
  const params = new URLSearchParams({ SingleLine: query.trim(), f: "json", outFields: "Match_addr,PlaceName,Country,Region,Subregion,City,MatchID", maxLocations: "6" });
  const response = await fetcher(`${endpoint}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error("Location search is temporarily unavailable.");
  return parseLocationCandidates(await response.json());
}
