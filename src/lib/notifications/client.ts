/**
 * Client-Side Notification & Service Worker Manager
 * Safe registration, push subscription lifecycle, and permission handling.
 */

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.error('Service Worker registration error:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const reg = await registerServiceWorker();
    if (!reg) return null;

    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      return sub;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any,
    });

    // Save to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });

    return sub;
  } catch (err) {
    console.error('Failed to subscribe to Web Push:', err);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;

    await fetch('/api/notifications/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    return await sub.unsubscribe();
  } catch (err) {
    console.error('Failed to unsubscribe from Web Push:', err);
    return false;
  }
}

export function showLocalNotification(
  title: string,
  body: string,
  url: string = '/track'
): void {
  if (getNotificationPermission() !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        data: { url },
      });
    });
  } else {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
    });
  }
}
