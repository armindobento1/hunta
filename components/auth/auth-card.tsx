"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  authErrorMessage,
  createEmailAccount,
  resetPassword,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/firebase/auth";
import { isIOSNativePlatform } from "@/lib/native/platform";

export interface AuthCardActions {
  google(): Promise<unknown>;
  apple(): Promise<unknown>;
  signIn(email: string, password: string): Promise<unknown>;
  signUp(
    displayName: string,
    email: string,
    password: string,
  ): Promise<unknown>;
  reset(email: string): Promise<unknown>;
}

const defaultActions: AuthCardActions = {
  google: signInWithGoogle,
  apple: signInWithApple,
  signIn: signInWithEmail,
  signUp: createEmailAccount,
  reset: resetPassword,
};

type FieldErrors = Partial<
  Record<"displayName" | "email" | "password", string>
>;

export function AuthCard({
  actions = defaultActions,
}: {
  actions?: AuthCardActions;
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const nextErrors: FieldErrors = {};
    if (mode === "sign-up" && displayName.trim().length < 2) {
      nextErrors.displayName = "Enter the name you want on your portfolio.";
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (password.length < 6) {
      nextErrors.password = "Password must contain at least six characters.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    await run(() =>
      mode === "sign-in"
        ? actions.signIn(email.trim(), password)
        : actions.signUp(displayName.trim(), email.trim(), password),
    );
  }

  async function requestReset() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrors((current) => ({
        ...current,
        email: "Enter your email before requesting a reset.",
      }));
      return;
    }

    await run(async () => {
      await actions.reset(email.trim());
      setMessage("Password reset email sent. Check your inbox.");
    });
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card-heading">
        <p className="eyebrow">Hunta</p>
        <h1 id="auth-title">
          {mode === "sign-in" ? "Welcome back" : "Start your portfolio"}
        </h1>
        <p>
          {mode === "sign-in"
            ? "Your private field records are waiting."
            : "Every fact, photograph, and route stays yours."}
        </p>
      </div>

      <Button
        className="google-button"
        disabled={pending}
        onClick={() => run(actions.google)}
        variant="secondary"
      >
        <span className="google-mark" aria-hidden="true">
          G
        </span>
        Continue with Google
      </Button>

      {isIOSNativePlatform() ? (
        <Button
          className="apple-button"
          disabled={pending}
          onClick={() => run(actions.apple)}
          variant="secondary"
        >
          <span className="apple-mark" aria-hidden="true">

          </span>
          Continue with Apple
        </Button>
      ) : null}

      <div className="auth-divider">
        <span>or use email</span>
      </div>

      <form onSubmit={submit} noValidate>
        {mode === "sign-up" ? (
          <FormField
            label="Display name"
            htmlFor="display-name"
            error={errors.displayName}
          >
            <Input
              id="display-name"
              autoComplete="name"
              value={displayName}
              aria-invalid={Boolean(errors.displayName)}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </FormField>
        ) : null}
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            aria-invalid={Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>

        {mode === "sign-in" ? (
          <button
            className="text-action auth-reset"
            type="button"
            disabled={pending}
            onClick={requestReset}
          >
            Forgot password?
          </button>
        ) : null}

        {message ? (
          <p className="auth-message" role="alert">
            {message}
          </p>
        ) : null}

        <Button className="auth-submit" disabled={pending} type="submit">
          {pending ? <Spinner label="Authenticating" /> : null}
          {mode === "sign-in" ? "Sign in" : "Create portfolio"}
        </Button>
      </form>

      <p className="auth-switch">
        {mode === "sign-in" ? "New to Hunta?" : "Already have an account?"}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMode((current) =>
              current === "sign-in" ? "sign-up" : "sign-in",
            );
            setErrors({});
            setMessage(null);
          }}
        >
          {mode === "sign-in" ? "Create account" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
