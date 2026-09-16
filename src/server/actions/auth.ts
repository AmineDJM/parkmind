'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { env, isAdminEmail } from '@/lib/env';
import { sendMail, devLinkHint } from '@/lib/mailer';
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  createAuthToken,
  consumeAuthToken,
  ensurePreferences,
} from '@/lib/auth';
import { logAudit } from '@/server/audit';
import { notify } from '@/server/notifications';

export interface AuthState {
  error?: string;
  ok?: boolean;
  message?: string;
  devLink?: string;
}

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent') ?? null,
  };
}

function link(path: string): string {
  return `${env.appUrl}${path}`;
}

const emailSchema = z.string().email('Adresse e-mail invalide.').toLowerCase();
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.');

async function roleFor(email: string): Promise<'USER' | 'ADMIN'> {
  return isAdminEmail(email) ? 'ADMIN' : 'USER';
}

// ── Sign up ───────────────────────────────────────────────────────────────
export async function signupAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, 'Votre nom est requis.').max(80),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Un compte existe déjà avec cette adresse.' };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: await roleFor(email),
    },
  });
  await ensurePreferences(user.id);

  const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION', 60 * 24);
  const verifyUrl = link(`/api/auth/verify?token=${token}`);
  await sendMail({
    to: email,
    subject: 'Vérifiez votre adresse e-mail',
    text: `Bienvenue sur Parkmind ! Confirmez votre adresse : ${verifyUrl}`,
  });
  await notify({
    userId: user.id,
    type: 'WELCOME',
    title: 'Bienvenue sur Parkmind',
    body: 'Configurez votre premier véhicule pour activer le pilote automatique.',
  });
  const meta = await requestMeta();
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'AUTH',
    action: 'SIGNUP',
    summary: `Inscription de ${email}`,
    ...meta,
  });

  await setSessionCookie({ id: user.id, email: user.email, role: user.role });
  redirect('/onboarding');
}

// ── Log in ────────────────────────────────────────────────────────────────
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, 'Mot de passe requis.') })
    .safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: 'Identifiants incorrects.' };
  }
  if (user.isSuspended) {
    return { error: 'Ce compte est suspendu. Contactez le support.' };
  }

  await setSessionCookie({ id: user.id, email: user.email, role: user.role });
  const meta = await requestMeta();
  await logAudit({
    userId: user.id,
    actor: user.id,
    category: 'AUTH',
    action: 'LOGIN',
    summary: `Connexion de ${email}`,
    ...meta,
  });
  redirect(user.onboardedAt ? '/dashboard' : '/onboarding');
}

// ── Magic link ──────────────────────────────────────────────────────────────
export async function magicLinkAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Adresse e-mail invalide.' };
  const email = parsed.data;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, role: await roleFor(email) },
    });
    await ensurePreferences(user.id);
  }

  const token = await createAuthToken(user.id, 'MAGIC_LINK', 30);
  const url = link(`/api/auth/magic?token=${token}`);
  await sendMail({
    to: email,
    subject: 'Votre lien de connexion Parkmind',
    text: `Connectez-vous en un clic : ${url} (valable 30 minutes).`,
  });
  return {
    ok: true,
    message: 'Lien de connexion envoyé. Vérifiez votre boîte mail.',
    devLink: devLinkHint(url),
  };
}

// ── Password reset ──────────────────────────────────────────────────────────
export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Adresse e-mail invalide.' };
  const email = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always report success to avoid leaking which emails exist.
  if (!user) {
    return { ok: true, message: 'Si un compte existe, un e-mail a été envoyé.' };
  }
  const token = await createAuthToken(user.id, 'PASSWORD_RESET', 60);
  const url = link(`/reset-password?token=${token}`);
  await sendMail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Réinitialisez votre mot de passe : ${url} (valable 60 minutes).`,
  });
  return {
    ok: true,
    message: 'Si un compte existe, un e-mail a été envoyé.',
    devLink: devLinkHint(url),
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .object({ token: z.string().min(1), password: passwordSchema })
    .safeParse({ token: formData.get('token'), password: formData.get('password') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }
  const userId = await consumeAuthToken(parsed.data.token, 'PASSWORD_RESET');
  if (!userId) {
    return { error: 'Lien invalide ou expiré. Refaites une demande.' };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await logAudit({
    userId,
    actor: userId,
    category: 'AUTH',
    action: 'PASSWORD_RESET',
    summary: 'Mot de passe réinitialisé.',
  });
  redirect('/login?reset=1');
}

// ── Log out ────────────────────────────────────────────────────────────────
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/');
}
