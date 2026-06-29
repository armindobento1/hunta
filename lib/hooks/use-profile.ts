"use client";

import { useEffect, useState } from "react";

import type { Profile } from "@/lib/domain/profile";
import {
  saveProfile,
  subscribeToProfile,
} from "@/lib/firebase/profile-repository";

import { useAuth } from "./use-auth";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let creating = false;

    return subscribeToProfile(
      user.uid,
      (nextProfile) => {
        if (nextProfile) {
          setProfile(nextProfile);
          setLoading(false);
          return;
        }

        if (!creating) {
          creating = true;
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
            setError("Your profile could not be created.");
            setLoading(false);
          });
        }
      },
      () => {
        setError("Your profile could not be loaded.");
        setLoading(false);
      },
    );
  }, [user]);

  return { profile, loading, error };
}
