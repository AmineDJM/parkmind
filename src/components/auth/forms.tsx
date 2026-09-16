'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  signupAction,
  loginAction,
  magicLinkAction,
  forgotPasswordAction,
  resetPasswordAction,
  type AuthState,
} from '@/server/actions/auth';
import { Input, Field, Alert, SubmitButton, Button } from '@/components/ui';

const initial: AuthState = {};

function DevLink({ state }: { state: AuthState }) {
  if (!state.devLink) return null;
  return (
    <Alert tone="info" className="text-xs">
      <span className="font-semibold">Dev :</span>{' '}
      <a href={state.devLink} className="break-all">
        {state.devLink}
      </a>
    </Alert>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signupAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="Nom" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" placeholder="Amine" required />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required />
      </Field>
      <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton size="lg" pendingLabel="Création…" className="mt-1 w-full">
        Créer mon compte
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-brand">
          Mot de passe oublié ?
        </Link>
      </div>
      <SubmitButton size="lg" pendingLabel="Connexion…" className="w-full">
        Se connecter
      </SubmitButton>
    </form>
  );
}

export function MagicLinkForm() {
  const [state, action] = useActionState(magicLinkAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <DevLink state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" placeholder="vous@exemple.fr" aria-label="E-mail" required />
        <SubmitButton variant="outline" pendingLabel="Envoi…" className="sm:w-auto">
          Recevoir un lien
        </SubmitButton>
      </div>
    </form>
  );
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <DevLink state={state} />
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton size="lg" pendingLabel="Envoi…" className="w-full">
        Envoyer le lien de réinitialisation
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <Field label="Nouveau mot de passe" htmlFor="password" hint="8 caractères minimum.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton size="lg" pendingLabel="Enregistrement…" className="w-full">
        Réinitialiser le mot de passe
      </SubmitButton>
    </form>
  );
}
