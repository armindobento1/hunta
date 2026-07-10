import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard";
import type { Profile } from "@/lib/domain/profile";
import { makeKill } from "@/tests/helpers/kill";
import { renderWithRouter } from "@/tests/helpers/render-router";

vi.mock("@/lib/hooks/use-auth", () => ({ useAuth: () => ({ user: { uid: "owner-1" } }) }));
vi.mock("@/lib/hooks/use-armory", () => ({ useArmory: () => ({ items: [], loadouts: [], loading: false, error: null }) }));

const profile: Profile = {
  id: "owner-1",
  displayName: "Marcus Halvorsen",
  avatarUrl: null,
  bio: "Fair chase, every time.",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("PortfolioDashboard", () => {
  it("guides a new user to create their first record", () => {
    renderWithRouter(<PortfolioDashboard profile={profile} kills={[]} />);

    expect(
      screen.getByText(/first hunt record starts here/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /record a hunt/i })).toHaveAttribute(
      "href",
      "/portfolio/kills/new",
    );
  });

  it("renders derived statistics and chronologically sorted cards", () => {
    const older = makeKill({ id: "older", date: "2024-10-05" });
    const newest = makeKill({ id: "newest", species: "Impala" });
    renderWithRouter(
      <PortfolioDashboard profile={profile} kills={[older, newest]} />,
    );

    expect(screen.getByText("2", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("16.8", { selector: "strong" })).toBeInTheDocument();
    const cards = screen.getAllByRole("link", { name: /view .* hunt/i });
    expect(cards[0]).toHaveAccessibleName(/impala/i);
    expect(cards[1]).toHaveAccessibleName(/greater kudu/i);
  });

  it("switches between list and grid card treatments", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PortfolioDashboard profile={profile} kills={[makeKill()]} />,
    );

    const grid = screen.getByRole("button", { name: /grid view/i });
    expect(grid).toHaveAttribute("aria-pressed", "false");
    await user.click(grid);
    expect(grid).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("feed-view")).toHaveClass("feed-grid");
  });

  it("groups the same records by country, place, and year", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PortfolioDashboard profile={profile} kills={[makeKill()]} />,
    );

    await user.click(screen.getByRole("button", { name: /by location/i }));

    expect(
      screen.getByRole("heading", { name: "South Africa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Eastern Cape")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  it("shows the armory design without inventing equipment records", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <PortfolioDashboard profile={profile} kills={[]} />,
    );

    await user.click(screen.getByRole("button", { name: "Armory" }));

    expect(screen.getByRole("heading", { name: /your armory is empty/i })).toBeInTheDocument();
    expect(screen.getByText(/add a weapon first/i)).toBeInTheDocument();
    expect(screen.queryByText(/sako s20/i)).not.toBeInTheDocument();
  });

  it("excludes drafts and trash from portfolio cards", () => {
    const draft = makeKill({
      id: "draft",
      status: "draft",
      coverMediaId: null,
      media: [],
    });
    const trashed = makeKill({
      id: "trashed",
      status: "trashed",
      trashedAt: "2025-06-13T00:00:00.000Z",
    });

    renderWithRouter(
      <PortfolioDashboard profile={profile} kills={[draft, trashed]} />,
    );
    expect(screen.queryByRole("link", { name: /view .* hunt/i })).toBeNull();
  });
});
