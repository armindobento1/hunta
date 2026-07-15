import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { buildPublicHunt } from "@/lib/domain/public-social";
import { PublicHuntPage } from "@/src/pages/public-hunt-page";
import { makeKill } from "@/tests/helpers/kill";

const mocks = vi.hoisted(() => ({
  getPublicHunt: vi.fn(),
}));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  getPublicHunt: mocks.getPublicHunt,
}));

vi.mock("@/components/social/public-hunt-detail", () => ({
  PublicHuntDetail: () => <div>Canonical hunt</div>,
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("PublicHuntPage", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderPage() {
    render(
      <MemoryRouter initialEntries={["/people/owner/hunts/hunt-1"]}>
        <Routes>
          <Route path="/people/:uid/hunts/:publicHuntId" element={<PublicHuntPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders a load failure separately from a missing hunt", async () => {
    mocks.getPublicHunt.mockRejectedValue(new Error("offline"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load this hunt. Check your connection and try again.",
    );
    expect(screen.queryByText("Public hunt not found.")).not.toBeInTheDocument();
  });

  it("renders not found when the hunt document is missing", async () => {
    mocks.getPublicHunt.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText("Public hunt not found.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("redirects an owner-mismatch URL to the canonical owner", async () => {
    const profile = {
      id: "real-owner",
      displayName: "Real Owner",
      avatarUrl: null,
      bio: "",
      searchName: "real owner",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };
    const hunt = buildPublicHunt(makeKill({ ownerId: profile.id }), profile);
    mocks.getPublicHunt.mockResolvedValue(hunt);

    render(
      <MemoryRouter initialEntries={[`/people/not-the-owner/hunts/${hunt.id}`]}>
        <Routes>
          <Route
            path="/people/:uid/hunts/:publicHuntId"
            element={<><PublicHuntPage /><CurrentPath /></>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent(
        `/people/${profile.id}/hunts/${hunt.id}`,
      );
    });
    expect(screen.getByText("Canonical hunt")).toBeInTheDocument();
    expect(mocks.getPublicHunt).toHaveBeenCalledWith(hunt.id);
  });
});
