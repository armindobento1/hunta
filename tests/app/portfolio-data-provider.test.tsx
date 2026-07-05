import { render, screen } from "@testing-library/react";

import { useKills } from "@/lib/hooks/use-kills";
import { useProfile } from "@/lib/hooks/use-profile";
import { PortfolioDataProvider } from "@/src/providers/portfolio-data-provider";

const mocks = vi.hoisted(() => ({
  auth: {
    user: {
      uid: "owner-1",
      email: "owner@example.com",
      displayName: "Owner One",
      photoURL: null,
    },
  },
  subscribeToProfile: vi.fn(() => vi.fn()),
  subscribeToKills: vi.fn(() => vi.fn()),
  subscribeToArmoryItems: vi.fn(() => vi.fn()),
  subscribeToLoadouts: vi.fn(() => vi.fn()),
  saveProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: mocks.auth.user, loading: false, error: null }),
}));

vi.mock("@/lib/firebase/profile-repository", () => ({
  subscribeToProfile: mocks.subscribeToProfile,
  saveProfile: mocks.saveProfile,
}));

vi.mock("@/lib/firebase/kill-repository", () => ({
  subscribeToKills: mocks.subscribeToKills,
}));

vi.mock("@/lib/firebase/armory-repository", () => ({
  subscribeToArmoryItems: mocks.subscribeToArmoryItems,
  subscribeToLoadouts: mocks.subscribeToLoadouts,
}));

function Probe({ route }: { route: string }) {
  const profile = useProfile();
  const kills = useKills();
  return <div>{`${route}:${profile.loading}:${kills.loading}`}</div>;
}

describe("PortfolioDataProvider", () => {
  beforeEach(() => {
    mocks.auth.user = {
      uid: "owner-1",
      email: "owner@example.com",
      displayName: "Owner One",
      photoURL: null,
    };
    mocks.subscribeToProfile.mockClear();
    mocks.subscribeToKills.mockClear();
    mocks.subscribeToArmoryItems.mockClear();
    mocks.subscribeToLoadouts.mockClear();
  });

  it("keeps one profile and kill subscription across private navigation", () => {
    const { rerender } = render(
      <PortfolioDataProvider>
        <Probe route="portfolio" />
      </PortfolioDataProvider>,
    );

    expect(mocks.subscribeToProfile).toHaveBeenCalledOnce();
    expect(mocks.subscribeToKills).toHaveBeenCalledOnce();

    rerender(
      <PortfolioDataProvider>
        <Probe route="trash" />
      </PortfolioDataProvider>,
    );

    expect(screen.getByText("trash:true:true")).toBeInTheDocument();
    expect(mocks.subscribeToProfile).toHaveBeenCalledOnce();
    expect(mocks.subscribeToKills).toHaveBeenCalledOnce();
  });

  it("cleans up and creates fresh subscriptions when the UID changes", () => {
    const { rerender } = render(
      <PortfolioDataProvider>
        <Probe route="portfolio" />
      </PortfolioDataProvider>,
    );
    const unsubscribeProfile = mocks.subscribeToProfile.mock.results[0].value;
    const unsubscribeKills = mocks.subscribeToKills.mock.results[0].value;

    mocks.auth.user = {
      uid: "owner-2",
      email: "second@example.com",
      displayName: "Owner Two",
      photoURL: null,
    };
    rerender(
      <PortfolioDataProvider>
        <Probe route="profile" />
      </PortfolioDataProvider>,
    );

    expect(unsubscribeProfile).toHaveBeenCalledOnce();
    expect(unsubscribeKills).toHaveBeenCalledOnce();
    expect(mocks.subscribeToProfile).toHaveBeenCalledTimes(2);
    expect(mocks.subscribeToProfile).toHaveBeenLastCalledWith(
      "owner-2",
      expect.any(Function),
      expect.any(Function),
    );
    expect(mocks.subscribeToKills).toHaveBeenCalledTimes(2);
  });
});
