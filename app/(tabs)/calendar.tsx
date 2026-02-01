import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Card from '../../components/ui/Card';

export default function CalendarScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [events, setEvents] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const db = await getDb();
            const allEvents = [];

            // 1. Appointments (Future only for now? Or all? Let's show future)
            const appointments = await db.getAllAsync<any>(`
                SELECT appointments.*, pets.name as pet_name 
                FROM appointments 
                LEFT JOIN pets ON appointments.pet_id = pets.id
                WHERE date >= date('now')
                ORDER BY date ASC
            `);
            appointments.forEach(a => allEvents.push({
                id: `apt-${a.id}`,
                date: a.date,
                title: a.reason || 'Tierarzt Termin',
                subtitle: `${a.pet_name} • ${a.doctor_name || 'Unbekannter Arzt'}`,
                type: 'appointment',
                time: a.time,
                color: '#6d28d9', // purple
                icon: 'medical'
            }));

            // 2. Vaccinations (Next Due)
            const vaccinations = await db.getAllAsync<any>(`
                SELECT vaccinations.*, pets.name as pet_name 
                FROM vaccinations 
                LEFT JOIN pets ON vaccinations.pet_id = pets.id
                WHERE next_due IS NOT NULL AND next_due >= date('now')
                ORDER BY next_due ASC
            `);
            vaccinations.forEach(v => allEvents.push({
                id: `vac-${v.id}`,
                date: v.next_due,
                title: `Impfung: ${v.name}`,
                subtitle: v.pet_name,
                type: 'vaccination',
                time: '09:00', // Default time for due dates
                color: '#2563eb', // blue
                icon: 'shield-checkmark'
            }));

            // 3. Routines (Generated for next 7 days maybe? Or just generic "Daily")
            // Showing daily routines in a monthly calendar is cluttered. 
            // Let's just show "One-time" routines if we had them, or just skip daily routines here.
            // User requested "Calendar", usually implies Appointments/Events, not daily tasks (that's Dashboard).
            // Let's stick to Appointments and Vaccinations for now, maybe add "Reminders" later.

            // Sort by Date then Time
            allEvents.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
                const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
                return dateA.getTime() - dateB.getTime();
            });

            // Group by Month
            const groupedArgs = allEvents.reduce((acc, event) => {
                const date = new Date(event.date);
                const month = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
                if (!acc[month]) acc[month] = [];
                acc[month].push(event);
                return acc;
            }, {});

            // Convert to array
            const groupedArray = Object.keys(groupedArgs).map(month => ({
                title: month,
                data: groupedArgs[month]
            }));

            setEvents(groupedArray);

        } catch (e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().then(() => setRefreshing(false));
    }, []);

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'} flex-row justify-between items-center bg-white dark:bg-slate-950`}>
                <Text className={`text-2xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Kalender</Text>
            </View>

            <ScrollView
                className="flex-1 px-5 pt-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {events.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <Ionicons name="calendar-outline" size={32} color={theme === 'dark' ? '#94a3b8' : '#cbd5e1'} />
                        </View>
                        <Text className={`text-center font-bold text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Keine anstehenden Termine</Text>
                        <Text className={`text-center text-sm mt-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Füge Tierarzt-Termine oder Impfungen hinzu.</Text>
                    </View>
                ) : (
                    events.map((group, groupIdx) => (
                        <View key={groupIdx} className="mb-6">
                            <Text className={`text-sm font-bold uppercase mb-3 tracking-wider ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`}>
                                {group.title}
                            </Text>
                            {group.data.map((event: any, idx: number) => (
                                <Card key={idx} className="mb-3 flex-row items-center" padding="md">
                                    {/* Date Box */}
                                    <View className={`items-center justify-center w-14 mr-4 rounded-xl py-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        <Text className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')}
                                        </Text>
                                        <Text className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                            {new Date(event.date).getDate()}
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <View className="flex-row items-center mb-1">
                                            <View className={`h-2 w-2 rounded-full mr-2`} style={{ backgroundColor: event.color }} />
                                            <Text className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {event.type === 'appointment' ? 'Termin' : 'Impfung'} • {event.time}
                                            </Text>
                                        </View>
                                        <Text className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{event.title}</Text>
                                        <Text className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{event.subtitle}</Text>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    ))
                )}
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
