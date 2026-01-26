import * as Notifications from 'expo-notifications';

export async function setupNotifications() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
}

export async function scheduleReminder(title: string, body: string, date: Date) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            sound: true,
        },
        trigger: date,
    });
}
