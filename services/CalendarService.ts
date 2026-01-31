import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export const CalendarService = {
    async requestPermissions() {
        if (Platform.OS === 'web') return false;

        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            return true;
        } else {
            return false;
        }
    },

    async getDefaultCalendarId() {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar =
            calendars.find((source) => source.isPrimary) ||
            calendars[0];

        return defaultCalendar ? defaultCalendar.id : null;
    },

    async createEvent(config: { title: string; startDate: Date; endDate?: Date; location?: string; notes?: string }) {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                Alert.alert("Berechtigung fehlt", "Zugriff auf Kalender verweigert.");
                return null;
            }

            const calendarId = await this.getDefaultCalendarId();
            if (!calendarId) {
                Alert.alert("Fehler", "Kein Kalender gefunden.");
                return null;
            }

            const startDate = new Date(config.startDate);
            const endDate = config.endDate ? new Date(config.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000);

            const eventId = await Calendar.createEventAsync(calendarId, {
                title: `🐾 ${config.title}`,
                startDate,
                endDate,
                location: config.location,
                notes: config.notes,
                timeZone: 'Europe/Berlin',
            });

            return eventId;
        } catch (e) {
            console.error("Calendar Error:", e);
            throw e;
        }
    }
};
