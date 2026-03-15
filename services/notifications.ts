import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleDailyReminder(hour: number = 9) {
  // Kanseller eksisterende varsler først
  await Notifications.cancelAllScheduledNotificationsAsync()

  const granted = await requestNotificationPermission()
  if (!granted) return false

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hudsjekk',
      body: 'Ta dagens analyse og hold streaken i gang.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  })

  return true
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}