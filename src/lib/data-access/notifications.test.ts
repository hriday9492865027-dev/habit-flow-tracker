import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  savePushSubscription,
  deletePushSubscription,
  getUserPushSubscriptions,
} from './notifications';
import { createUser } from './users';

describe('Notification Preferences & Web Push Data Access', () => {
  test('creates and retrieves default notification preferences for new user', async () => {
    const testEmail = `test_notif_${Date.now()}@example.com`;
    const user = await createUser(testEmail, 'Notif Tester', 'Password123!');

    const prefs = await getNotificationPreferences(user.id);
    assert.strictEqual(prefs.userId, user.id);
    assert.strictEqual(prefs.enabled, false);
    assert.strictEqual(prefs.mode, 'interval');
    assert.strictEqual(prefs.intervalMinutes, 60);
    assert.strictEqual(prefs.quietHoursStart, '22:00');
    assert.strictEqual(prefs.quietHoursEnd, '06:00');
  });

  test('updates notification preferences and schedules', async () => {
    const testEmail = `test_notif_update_${Date.now()}@example.com`;
    const user = await createUser(testEmail, 'Update Tester', 'Password123!');

    const updated = await updateNotificationPreferences(user.id, {
      enabled: true,
      mode: 'specific_times',
      specificTimes: ['08:00', '12:00', '18:00'],
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
    });

    assert.strictEqual(updated.enabled, true);
    assert.strictEqual(updated.mode, 'specific_times');
    assert.deepStrictEqual(updated.specificTimes, ['08:00', '12:00', '18:00']);
    assert.strictEqual(updated.quietHoursStart, '23:00');
    assert.strictEqual(updated.quietHoursEnd, '07:00');
  });

  test('registers and deletes push subscriptions scoped strictly to user', async () => {
    const testEmail = `test_sub_${Date.now()}@example.com`;
    const user = await createUser(testEmail, 'Sub Tester', 'Password123!');
    const endpoint = `https://fcm.googleapis.com/fcm/send/test_endpoint_${Date.now()}`;

    await savePushSubscription(user.id, {
      endpoint,
      p256dh: 'test_p256dh_key',
      auth: 'test_auth_secret',
    });

    const subs = await getUserPushSubscriptions(user.id);
    assert.strictEqual(subs.length, 1);
    assert.strictEqual(subs[0].endpoint, endpoint);

    await deletePushSubscription(user.id, endpoint);
    const subsAfter = await getUserPushSubscriptions(user.id);
    assert.strictEqual(subsAfter.length, 0);
  });
});
