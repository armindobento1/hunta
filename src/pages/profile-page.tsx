import { ArrowLeft, LogOut, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/lib/domain/profile";
import { signOutCurrentUser } from "@/lib/firebase/auth";
import { saveProfile } from "@/lib/firebase/profile-repository";
import { uploadAvatar } from "@/lib/firebase/storage-repository";
import { useAuth } from "@/lib/hooks/use-auth";
import { useProfile } from "@/lib/hooks/use-profile";

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, error } = useProfile();

  if (loading || !profile || !user) {
    return (
      <main className="centered-state">{error || "Loading profile…"}</main>
    );
  }

  return (
    <ProfileSettings
      key={profile.updatedAt}
      profile={profile}
      uid={user.uid}
    />
  );
}

function ProfileSettings({ profile, uid }: { profile: Profile; uid: string }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const avatarUrl = avatar
        ? await uploadAvatar({ uid, file: avatar })
        : profile.avatarUrl;
      await saveProfile({
        ...profile,
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
        updatedAt: new Date().toISOString(),
      });
      setMessage("Profile saved.");
      setAvatar(null);
    } catch {
      setMessage("Profile could not be saved. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-page">
      <Link to="/portfolio">
        <ArrowLeft aria-hidden="true" /> Portfolio
      </Link>
      <p className="eyebrow">Account</p>
      <h1>Profile settings</h1>
      <form onSubmit={submit}>
        <FormField label="Display name" htmlFor="profile-name">
          <Input
            id="profile-name"
            required
            maxLength={80}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </FormField>
        <FormField label="Bio" htmlFor="profile-bio">
          <textarea
            id="profile-bio"
            className="text-input story-input"
            maxLength={280}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </FormField>
        <FormField
          label="Avatar"
          htmlFor="profile-avatar"
          hint="JPEG, PNG, or WebP up to 15 MB."
        >
          <Input
            id="profile-avatar"
            type="file"
            accept="image/*"
            onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
          />
        </FormField>
        {message ? <p role="status">{message}</p> : null}
        <Button type="submit" disabled={saving}>
          <Save aria-hidden="true" size={16} />
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>
      <div className="account-links">
        <Link to="/portfolio/trash">
          <Trash2 aria-hidden="true" /> Open trash
        </Link>
        <button type="button" onClick={signOutCurrentUser}>
          <LogOut aria-hidden="true" /> Sign out
        </button>
      </div>
    </main>
  );
}
