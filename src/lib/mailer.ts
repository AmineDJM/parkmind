import { env } from '@/lib/env';

/**
 * Mailer abstraction. The MVP ships a `console` driver that logs emails to
 * stdout (and the caller can surface magic links in dev). SMTP/Resend drivers
 * can be added without touching callers.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  switch (env.mailDriver) {
    case 'console':
    default:
      // eslint-disable-next-line no-console
      console.log(
        `\n📧 [mail:${env.mailDriver}] to=${msg.to}\n   from=${env.mailFrom}\n   subject=${msg.subject}\n   ${msg.text}\n`,
      );
      return;
    // Real drivers (smtp/resend) would be implemented here, guarded by their env.
  }
}

/** In development we surface magic links directly so testing needs no inbox. */
export function devLinkHint(url: string): string | undefined {
  return env.isProduction ? undefined : url;
}
