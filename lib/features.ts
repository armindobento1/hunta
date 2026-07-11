/**
 * Release-scope feature flags.
 *
 * SOCIAL_ENABLED gates the entire public/social surface: public routes,
 * social listeners, the publish toggle, and every client write to the
 * public collections (publicProfiles, publicHunts, farms, follows,
 * notifications). It is OFF unless VITE_SOCIAL_ENABLED is exactly "true",
 * so the default build is private-only (audit v1.1 F-01/F-05/F-06
 * containment). Do not re-enable until the public location projection,
 * consent, and moderation findings are resolved.
 */
export const SOCIAL_ENABLED = import.meta.env.VITE_SOCIAL_ENABLED === "true";
