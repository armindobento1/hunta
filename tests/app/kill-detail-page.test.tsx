import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { KillDetailPage } from "@/src/pages/kill-detail-page";
import { makeKill } from "@/tests/helpers/kill";

const mocks = vi.hoisted(() => ({
  getKill: vi.fn(),
  moveKillToTrash: vi.fn(),
  unpublishHunt: vi.fn(),
}));

vi.mock("@/lib/features", () => ({ SOCIAL_ENABLED: true }));

vi.mock("@/lib/firebase/kill-repository", () => ({
  getKill: mocks.getKill,
  moveKillToTrash: mocks.moveKillToTrash,
}));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  unpublishHunt: mocks.unpublishHunt,
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "owner-1" }, loading: false, error: null }),
}));

describe("KillDetailPage trash flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.moveKillToTrash.mockResolvedValue(undefined);
    mocks.unpublishHunt.mockResolvedValue(undefined);
  });

  function renderPage(isPublic: boolean) {
    mocks.getKill.mockResolvedValue(makeKill({ isPublic, route: null }));
    render(
      <MemoryRouter initialEntries={["/portfolio/kills/kill-1"]}>
        <Routes>
          <Route path="/portfolio/kills/:killId" element={<KillDetailPage />} />
          <Route path="/portfolio" element={<div>Portfolio</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  async function confirmTrash() {
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Greater Kudu" });
    await user.click(screen.getByRole("button", { name: /move to trash/i }));
    await user.click(screen.getByRole("button", { name: /confirm move to trash/i }));
  }

  it("unpublishes a published kill before moving it to trash", async () => {
    const calls: string[] = [];
    mocks.unpublishHunt.mockImplementation(async () => {
      calls.push("unpublish");
    });
    mocks.moveKillToTrash.mockImplementation(async () => {
      calls.push("trash");
    });
    renderPage(true);

    await confirmTrash();

    await waitFor(() => expect(screen.getByText("Portfolio")).toBeInTheDocument());
    expect(calls).toEqual(["unpublish", "trash"]);
    expect(mocks.unpublishHunt).toHaveBeenCalledWith("owner-1", "kill-1");
  });

  it("does not move a published kill when unpublishing fails", async () => {
    mocks.unpublishHunt.mockRejectedValue(new Error("The public post could not be removed."));
    renderPage(true);

    await confirmTrash();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The public post could not be removed.",
    );
    expect(mocks.moveKillToTrash).not.toHaveBeenCalled();
  });

  it("moves a private kill directly to trash", async () => {
    renderPage(false);

    await confirmTrash();

    await waitFor(() => expect(mocks.moveKillToTrash).toHaveBeenCalledOnce());
    expect(mocks.unpublishHunt).not.toHaveBeenCalled();
  });
});
