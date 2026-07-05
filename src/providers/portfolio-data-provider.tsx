import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import type { Kill } from "@/lib/domain/kill";
import type { ArmoryItem, Loadout } from "@/lib/domain/armory";
import { subscribeToArmoryItems, subscribeToLoadouts } from "@/lib/firebase/armory-repository";
import type { Profile } from "@/lib/domain/profile";
import { subscribeToKills } from "@/lib/firebase/kill-repository";
import {
  saveProfile,
  subscribeToProfile,
} from "@/lib/firebase/profile-repository";
import { useAuth } from "@/lib/hooks/use-auth";
import { buildPublicProfile } from "@/lib/domain/public-social";
import { savePublicProfile } from "@/lib/firebase/public-social-repository";

export interface ProfileDataState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export interface KillDataState {
  kills: Kill[];
  loading: boolean;
  error: string | null;
}

interface PortfolioDataState {
  profileState: ProfileDataState;
  killsState: KillDataState;
  armoryState: { items: ArmoryItem[]; loadouts: Loadout[]; loading: boolean; error: string | null };
}

const PortfolioDataContext = createContext<PortfolioDataState | null>(null);

export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <PortfolioDataSession key={user.uid} user={user}>
      {children}
    </PortfolioDataSession>
  );
}

function PortfolioDataSession({
  children,
  user,
}: {
  children: ReactNode;
  user: User;
}) {
  const [profileState, setProfileState] = useState<ProfileDataState>({
    profile: null,
    loading: true,
    error: null,
  });
  const [killsState, setKillsState] = useState<KillDataState>({
    kills: [],
    loading: true,
    error: null,
  });
  const [armoryState, setArmoryState] = useState<PortfolioDataState["armoryState"]>({ items: [], loadouts: [], loading: true, error: null });

  useEffect(() => {
    let creatingProfile = false;

    const unsubscribeProfile = subscribeToProfile(
      user.uid,
      (profile) => {
        if (profile) {
          setProfileState({ profile, loading: false, error: null });
          void savePublicProfile(buildPublicProfile(profile));
          return;
        }

        if (!creatingProfile) {
          creatingProfile = true;
          const now = new Date().toISOString();
          const fallbackName = user.email?.split("@")[0] || "Hunter";
          saveProfile({
            id: user.uid,
            displayName: user.displayName || fallbackName,
            avatarUrl: user.photoURL,
            bio: "",
            createdAt: now,
            updatedAt: now,
          }).catch(() => {
            setProfileState({
              profile: null,
              loading: false,
              error: "Your profile could not be created.",
            });
          });
        }
      },
      () => {
        setProfileState({
          profile: null,
          loading: false,
          error: "Your profile could not be loaded.",
        });
      },
    );

    const unsubscribeKills = subscribeToKills(
      user.uid,
      (kills) => {
        setKillsState({ kills, loading: false, error: null });
      },
      () => {
        setKillsState({
          kills: [],
          loading: false,
          error: "Your portfolio could not be loaded. Check your connection.",
        });
      },
    );
    let itemReady = false;
    let loadoutReady = false;
    const ready = () => itemReady && loadoutReady;
    const unsubscribeItems = subscribeToArmoryItems(user.uid, (items) => {
      itemReady = true;
      setArmoryState((current) => ({ ...current, items, loading: !ready(), error: null }));
    }, () => setArmoryState((current) => ({ ...current, loading: false, error: "Your armory could not be loaded." })));
    const unsubscribeLoadouts = subscribeToLoadouts(user.uid, (loadouts) => {
      loadoutReady = true;
      setArmoryState((current) => ({ ...current, loadouts, loading: !ready(), error: null }));
    }, () => setArmoryState((current) => ({ ...current, loading: false, error: "Your loadouts could not be loaded." })));

    return () => {
      unsubscribeProfile();
      unsubscribeKills();
      unsubscribeItems();
      unsubscribeLoadouts();
    };
  }, [user]);

  const value = useMemo(
    () => ({ profileState, killsState, armoryState }),
    [armoryState, killsState, profileState],
  );

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData(): PortfolioDataState {
  const value = useContext(PortfolioDataContext);
  if (!value) {
    throw new Error(
      "Portfolio data hooks must be used within PortfolioDataProvider.",
    );
  }
  return value;
}
