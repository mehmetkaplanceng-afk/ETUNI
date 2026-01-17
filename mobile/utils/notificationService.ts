import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authFetch } from '../api/authFetch';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    try {
        // Physical device check
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Get Expo push token (projectId auto-detected from app.json)
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        console.log('Got push token:', token.substring(0, 30) + '...');

        // Configure Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366f1',
            });
        }

        // Send token to backend
        await sendTokenToBackend(token);

        return token;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Send push token to backend
 */
async function sendTokenToBackend(token: string) {
    try {
        const response = await authFetch('/api/push-token', {
            method: 'POST',
            body: JSON.stringify({ pushToken: token })
        });

        if (response.ok) {
            console.log('Push token registered with backend');
        } else {
            console.error('Failed to register push token with backend');
        }
    } catch (error) {
        console.error('Error sending token to backend:', error);
    }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
    // Listener for notifications received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
    });

    // Listener for tapping on notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        onNotificationTapped?.(response);
    });

    // Return cleanup function
    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}
