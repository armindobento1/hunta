# Hunta Firebase Cutover Design

## Goal

Rename the customer-facing product from Fieldnote to Hunta and cut the existing
Next.js application over to the fresh Firebase project `onfoothunta`. No users,
Firestore records, or Storage objects will be migrated from
`fieldnote-hunting-armindo`.

## Chosen approach

Use a direct cutover. Register the production web application in
`onfoothunta`, configure its Authentication, Firestore, and Storage services,
deploy the repository's security rules and indexes, replace the local and
Vercel Firebase web configuration, and redeploy the existing Vercel site.

The old Firebase project remains unchanged as a rollback source until the new
deployment has passed its verification checklist. The application will not
read from or write to both projects at the same time.

## Product branding

All customer-visible uses of the Fieldnote product name become Hunta, including
page metadata, landing and authentication labels, accessibility labels, empty
states, and onboarding copy. The single-letter landing mark becomes `H`.
Generic uses of “field note” as a record noun become “hunt record” so the old
brand does not remain in normal UI text.

Internal source filenames and route structures stay unchanged unless a name is
customer-visible. This keeps the change focused and avoids unrelated migration
risk.

## Firebase architecture

Firebase Authentication supplies the UID. Firestore documents remain under
`users/{uid}` and `users/{uid}/kills/{killId}`. Storage objects remain under
`users/{uid}/...`. Existing repository adapters and domain schemas do not
change, so the four portfolio invariants retain the same code-level guards.

The `onfoothunta` project will contain:

- One Firebase Web app for the Vercel-hosted Hunta frontend.
- Email/password and Google authentication providers.
- Cloud Firestore in Native mode.
- Cloud Storage on the Blaze plan, because new default Storage buckets require
  billing.
- The committed Firestore rules, Storage rules, and Firestore indexes from this
  repository.
- Authorized authentication domains for localhost and the deployed Vercel
  domain.

The browser receives only Firebase's public web configuration. No service
account key or other server credential will be added to the frontend or Vercel.

## Configuration and deployment flow

1. Register the Hunta web app in `onfoothunta` and obtain its web configuration.
2. Enable email/password and Google sign-in, with Hunta as the public app name.
3. Create Firestore and Storage, selecting the production region deliberately
   before creation because data location is difficult to change later.
4. Point `.firebaserc` and `.env.local` at `onfoothunta`.
5. Deploy Firestore rules, Storage rules, and indexes to `onfoothunta`.
6. Replace all Firebase environment variables in the Vercel project and add the
   Vercel domain to Firebase Authentication's authorized domains.
7. Deploy the Hunta-branded build to the existing Vercel site.

## Security and data integrity

The cutover does not modify the kill schema, GPX derivation, edit-preservation
logic, attachment paths, or trash-only deletion behavior. Ownership continues
to be enforced independently in Firestore and Storage rules by matching the
authenticated UID to the path UID. Rules are deployed before the production
frontend is pointed at the new project.

The new project starts empty. Test records created during verification are
real records in `onfoothunta` and may be removed only through the application's
recoverable trash workflow; uploaded source media and GPX files are not
silently deleted.

## Failure handling and rollback

If a Firebase service cannot be created, a provider cannot be enabled, billing
is not active, or a deployment check fails, the current Vercel production
environment remains on the old Firebase configuration until the new backend is
ready. If failure occurs after the Vercel cutover, restore the previous Vercel
environment values and redeploy. No cross-project writes or partial data
migration are attempted.

## Verification

Local release gates:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:rules` with Java 21
- `npm run build`

Production smoke checks:

- The public site and browser title show Hunta with no Fieldnote branding.
- A new email/password account can register, sign out, and sign back in.
- Google sign-in opens against the `onfoothunta` project.
- A profile can be saved and remains private to its owner.
- A complete hunt record can be created, viewed, edited, grouped, and moved to
  recoverable trash without losing its core facts.
- Photo/video upload and GPX upload/download work against the new Storage
  bucket.
- A second account cannot read or write the first account's Firestore records
  or Storage objects.

## Documentation updates

After verification, update the README, `.env.example` guidance if necessary,
the smallest affected vault note, and the Firebase project references used by
the repository. The obsolete project is not deleted as part of this task.
