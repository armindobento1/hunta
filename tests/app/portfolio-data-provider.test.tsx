import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { Profile } from "@/lib/domain/profile";
import { useKills } from "@/lib/hooks/use-kills";
import { useProfile } from "@/lib/hooks/use-profile";
import { ProfilePage } from "@/src/pages/profile-page";
import { PortfolioDataProvider } from "@/src/providers/portfolio-data-provider";

const mocks = vi.hoisted(() => ({
  auth: {
    user: {
      uid: "owner-1",
      email: "owner@example.com",
      displayName: "Owner One",
      photoURL: null,
      providerData: [],
    },
  },
  profileCallback: null as ((profile: Profile | null) => void) | null,
  savePublicProfile: vi.fn().mockResolvedValue(undefined),
  subscribeToProfile: vi.fn<
    (uid: string, onValue: (profile: Profile | null) => void) => () => void
  >(() => vi.fn()),
  subscribeToKills: vi.fn(() => vi.fn()),
  subscribeToArmoryItems: vi.fn(() => vi.fn()),
  subscribeToLoadouts: vi.fn(() => vi.fn()),
  saveProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/hooks/use-auth", () => ({
  useAuth: () => ({ user: mocks.auth.user, loading: false, error: null }),
}));

vi.mock("@/lib/features", () => ({ SOCIAL_ENABLED: true }));

vi.mock("@/lib/firebase/public-social-repository", () => ({
  savePublicProfile: mocks.savePublicProfile,
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
      providerData: [],
    };
    mocks.profileCallback = null;
    mocks.savePublicProfile.mockReset();
    mocks.savePublicProfile.mockResolvedValue(undefined);
    mocks.subscribeToProfile.mockClear();
    mocks.subscribeToKills.mockClear();
    mocks.subscribeToArmoryItems.mockClear();
    mocks.subscribeToLoadouts.mockClear();
    mocks.subscribeToProfile.mockImplementation((_uid, onValue) => {
      mocks.profileCallback = onValue;
      return vi.fn();
    });
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

  it("subscribes only to the data requested by a route", () => {
    render(
      <PortfolioDataProvider needs={{ kills: true }}>
        <Probe route="kills-only" />
      </PortfolioDataProvider>,
    );

    expect(screen.getByText("kills-only:false:true")).toBeInTheDocument();
    expect(mocks.subscribeToProfile).not.toHaveBeenCalled();
    expect(mocks.subscribeToKills).toHaveBeenCalledOnce();
    expect(mocks.subscribeToArmoryItems).not.toHaveBeenCalled();
    expect(mocks.subscribeToLoadouts).not.toHaveBeenCalled();
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
      providerData: [],
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

  it("writes identical consecutive profile snapshots only once", async () => {
    let resolveWrite!: () => void;
    mocks.savePublicProfile.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      }),
    );
    render(
      <PortfolioDataProvider>
        <Probe route="profile" />
      </PortfolioDataProvider>,
    );
    const profile = {
      id: "owner-1",
      displayName: "Owner One",
      avatarUrl: null,
      bio: "Private profile remains usable.",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    };

    act(() => {
      mocks.profileCallback?.(profile);
      mocks.profileCallback?.(profile);
    });

    expect(mocks.savePublicProfile).toHaveBeenCalledOnce();
    await act(async () => resolveWrite());
    act(() => mocks.profileCallback?.(profile));
    expect(mocks.savePublicProfile).toHaveBeenCalledOnce();
  });

  it("retries a failed public sync while keeping the profile page usable", async () => {
    mocks.savePublicProfile
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <PortfolioDataProvider>
          <ProfilePage />
        </PortfolioDataProvider>
      </MemoryRouter>,
    );
    const profile = {
      id: "owner-1",
      displayName: "Owner One",
      avatarUrl: null,
      bio: "Private profile remains usable.",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    };

    act(() => mocks.profileCallback?.(profile));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your public profile could not be updated. Your private profile is still available.",
    );
    expect(screen.getByRole("heading", { name: "Profile settings" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toHaveValue("Owner One");

    act(() => mocks.profileCallback?.(profile));

    await waitFor(() => expect(mocks.savePublicProfile).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
