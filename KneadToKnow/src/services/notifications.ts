import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Request notification permissions and configure the notification channel.
 * Call this once on app startup.
 */
export async function setupNotifications(): Promise<boolean> {
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('timers', {
      name: 'Bake Timers',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e8a849',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedule a local notification for a timer completion.
 */
export async function scheduleTimerNotification(
  label: string,
  seconds: number
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍞 Knead to Know',
      body: `${label} — Time's up!`,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'timers' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  return id;
}

/**
 * Cancel a previously scheduled notification.
 */
export async function cancelTimerNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all pending notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
