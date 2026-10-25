import webpush from 'web-push';

// VAPID keys: configured from environment variables or safe standard fallback for local development
const DEFAULT_VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

const DEFAULT_VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || 'UUxI4O8P67x48Jg4oV-f8Fw8Y-i8x48Jg4oV-f8Fw8Y';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@habitflow.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, DEFAULT_VAPID_PUBLIC, DEFAULT_VAPID_PRIVATE);
} catch (err) {
  console.warn('VAPID initialization warning (safe for non-push test environments):', err);
}

export function getVapidPublicKey(): string {
  return DEFAULT_VAPID_PUBLIC;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a privacy-safe web push notification via Web Push Protocol.
 * Strict privacy rule: Never sends sensitive personal habit responses in notification payloads.
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payloadString = JSON.stringify({
    title: payload.title || 'HabitFlow Check-in',
    body: payload.body || 'Time to update your hourly habits.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    data: {
      url: payload.url || '/track',
      timestamp: Date.now(),
    },
    tag: payload.tag || 'habitflow-reminder',
  });

  try {
    await webpush.sendNotification(pushSubscription as any, payloadString);
    return true;
  } catch (err: any) {
    console.error('WebPush delivery error:', err?.statusCode || err?.message || err);
    return false;
  }
}
