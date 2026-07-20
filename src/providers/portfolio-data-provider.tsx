import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { SOCIAL_ENABLED } from "@/lib/features";
import { useAuth } from "@/lib/hooks/use-auth";
import { buildPublicProfile, type PublicProfile } from "@/lib/domain/public-social";
import { savePublicProfile } from "@/lib/firebase/public-social-repository";

export interface ProfileDataState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  syncError: string | null;
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

export interface PortfolioDataNeeds {
  profile?: boolean;
  kills?: boolean;
  armory?: boolean;
}

const PortfolioDataContext = createContext<PortfolioDataState | null>(null);

export function PortfolioDataProvider({ children, needs }: { children: ReactNode; needs?: PortfolioDataNeeds }) {
  const { user } = useAuth();

  if (!user) return null;

  const profileEnabled = needs ? needs.profile === true : true;
  const killsEnabled = needs ? needs.kills === true : true;
  const armoryEnabled = needs ? needs.armory === true : true;

  return (
    <PortfolioDataSession
      key={`${user.uid}:${Number(profileEnabled)}${Number(killsEnabled)}${Number(armoryEnabled)}`}
      user={user}
      profileEnabled={profileEnabled}
      killsEnabled={killsEnabled}
      armoryEnabled={armoryEnabled}
    >
      {children}
    </PortfolioDataSession>
  );
}

function PortfolioDataSession({
  children,
  user,
  profileEnabled,
  killsEnabled,
  armoryEnabled,
}: {
  children: ReactNode;
  user: User;
  profileEnabled: boolean;
  killsEnabled: boolean;
  armoryEnabled: boolean;
}) {
  const [profileState, setProfileState] = useState<ProfileDataState>({
    profile: null,
    loading: profileEnabled,
    error: null,
    syncError: null,
  });
  const [killsState, setKillsState] = useState<KillDataState>({
    kills: [],
    loading: killsEnabled,
    error: null,
  });
  const [armoryState, setArmoryState] = useState<PortfolioDataState["armoryState"]>({ items: [], loadouts: [], loading: armoryEnabled, error: null });
  const lastSyncedRef = useRef<string | null>(null);
  const syncingRef = useRef<string | null>(null);
  const pendingSyncRef = useRef<{ profile: PublicProfile; value: string } | null>(null);

  useEffect(() => {
    let creatingProfile = false;
    let active = true;

    function syncPublicProfile(profile: PublicProfile, syncValue: string) {
      if (
        lastSyncedRef.current === syncValue
        || syncingRef.current === syncValue
      ) {
        return;
      }
      if (syncingRef.current) {
        pendingSyncRef.current = { profile, value: syncValue };
        return;
      }

      syncingRef.current = syncValue;
      void savePublicProfile(profile)
        .then(() => {
          lastSyncedRef.current = syncValue;
          if (active) {
            setProfileState((current) => ({
              ...current,
              syncError: null,
            }));
          }
        })
        .catch(() => {
          if (active) {
            setProfileState((current) => ({
              ...current,
              syncError: "Your public profile could not be updated. Your private profile is still available.",
            }));
          }
        })
        .finally(() => {
          if (syncingRef.current === syncValue) syncingRef.current = null;
          const pending = pendingSyncRef.current;
          pendingSyncRef.current = null;
          if (active && pending) syncPublicProfile(pending.profile, pending.value);
        });
    }

    const unsubscribeProfile = profileEnabled ? subscribeToProfile(
      user.uid,
      (profile) => {
        if (profile) {
          setProfileState((current) => ({
            profile,
            loading: false,
            error: null,
            syncError: current.syncError,
          }));
          if (SOCIAL_ENABLED) {
            const publicProfile = buildPublicProfile(profile);
            const syncValue = JSON.stringify(publicProfile);
            syncPublicProfile(publicProfile, syncValue);
          }
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
              syncError: null,
            });
          });
        }
      },
      () => {
        setProfileState({
          profile: null,
          loading: false,
          error: "Your profile could not be loaded.",
          syncError: null,
        });
      },
    ) : () => {};

    const unsubscribeKills = killsEnabled ? subscribeToKills(
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
    ) : () => {};
    let itemSettled = false;
    let loadoutSettled = false;
    let itemError: string | null = null;
    let loadoutError: string | null = null;
    const loadingArmory = () => !(itemSettled && loadoutSettled);
    const unsubscribeItems = armoryEnabled ? subscribeToArmoryItems(user.uid, (items) => {
        itemSettled = true;
        itemError = null;
        setArmoryState((current) => ({ ...current, items, loading: loadingArmory(), error: itemError ?? loadoutError ?? null }));
      }, () => {
        itemSettled = true;
        itemError = "Your armory could not be loaded.";
        setArmoryState((current) => ({ ...current, loading: loadingArmory(), error: itemError ?? loadoutError ?? null }));
      }) : () => {};
    const unsubscribeLoadouts = armoryEnabled ? subscribeToLoadouts(user.uid, (loadouts) => {
        loadoutSettled = true;
        loadoutError = null;
        setArmoryState((current) => ({ ...current, loadouts, loading: loadingArmory(), error: itemError ?? loadoutError ?? null }));
      }, () => {
        loadoutSettled = true;
        loadoutError = "Your loadouts could not be loaded.";
        setArmoryState((current) => ({ ...current, loading: loadingArmory(), error: itemError ?? loadoutError ?? null }));
      }) : () => {};

    return () => {
      active = false;
      unsubscribeProfile();
      unsubscribeKills();
      unsubscribeItems();
      unsubscribeLoadouts();
    };
  }, [armoryEnabled, killsEnabled, profileEnabled, user]);

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
