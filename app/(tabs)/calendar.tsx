import { View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDb } from '../../db';

// Locale Setup (Outside Component)
LocaleConfig.locales['de'] = {
    monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    monthNamesShort: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'],
    dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    dayNamesShort: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
    today: "Heute"
};
LocaleConfig.locales['en'] = {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
    today: "Today"
};

interface AgendaItem {
    id: string; // Unique ID for key
    name: string;
    type: 'routine' | 'log' | 'Termin';
    time?: string;
    details?: string;
    color?: string;
    date: string; // YYYY-MM-DD
}

export default function CalendarScreen() {
    const { theme } = useTheme();
    const { language, t } = useLanguage();

    // States
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [allItems, setAllItems] = useState<AgendaItem[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});

    // Load Data
    const loadData = useCallback(async () => {
        try {
            const db = await getDb();
            const now = new Date();
            const items: AgendaItem[] = [];
            const marks: any = {};

            // 1. Routines (Next 30 days)
            const routines = await db.getAllAsync<any>('SELECT * FROM routines');
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(now.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];

                routines.forEach((r, idx) => {
                    items.push({
                        id: `routine-${dateStr}-${r.id}-${idx}`,
                        name: r.title,
                        type: 'routine',
                        time: r.time_of_day,
                        date: dateStr,
                        color: theme === 'dark' ? '#1e293b' : '#f1f5f9'
                    });
                    // Mark date
                    if (!marks[dateStr]) marks[dateStr] = { dots: [] };
                    if (!marks[dateStr].dots.find((dot: any) => dot.color === '#94a3b8')) {
                        marks[dateStr].dots.push({ color: '#94a3b8' });
                    }
                });
            }

            // 2. Logs (Historical & Future)
            const logs = await db.getAllAsync<any>('SELECT * FROM logs');
            logs.forEach(l => {
                const parts = l.date.split('.');
                if (parts.length === 3) {
                    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    items.push({
                        id: `log-${l.id}`,
                        name: l.title,
                        type: 'log',
                        details: l.description,
                        date: isoDate,
                        color: theme === 'dark' ? '#312e81' : '#e0e7ff'
                    });

                    if (!marks[isoDate]) marks[isoDate] = { dots: [] };
                    if (!marks[isoDate].dots.find((dot: any) => dot.color === '#6366f1')) {
                        marks[isoDate].dots.push({ color: '#6366f1' });
                    }
                }
            });

            setAllItems(items);
            setMarkedDates(marks);

        } catch (e) {
            console.error(e);
        }
    }, [theme]);

    useFocusEffect(
        useCallback(() => {
            LocaleConfig.defaultLocale = language;
            loadData();
        }, [language, loadData])
    );

    // Filter items for selected date
    const selectedItems = useMemo(() => {
        return allItems.filter(i => i.date === selectedDate);
    }, [allItems, selectedDate]);

    // Theme object memoized
    const calendarTheme = useMemo(() => ({
        calendarBackground: theme === 'dark' ? '#0f172a' : '#ffffff',
        textSectionTitleColor: '#b6c1cd',
        selectedDayBackgroundColor: '#059669',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#059669',
        dayTextColor: theme === 'dark' ? '#e2e8f0' : '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: '#00adf5',
        selectedDotColor: '#ffffff',
        arrowColor: '#059669',
        monthTextColor: theme === 'dark' ? '#e2e8f0' : '#2d4150',
        indicatorColor: 'blue',
    }), [theme]);

    // Render list item
    const renderItem = ({ item }: { item: AgendaItem }) => {
        const isAppt = item.type === 'Termin';
        return (
            <TouchableOpacity
                className={`mx-5 mb-3 p-4 rounded-xl border shadow-sm ${isAppt
                    ? (theme === 'dark' ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-50 border-indigo-200')
                    : (theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-secondary-100')
                    }`}
                style={!isAppt && item.color ? { backgroundColor: item.color, borderColor: item.color } : {}}
                onPress={() => {
                    if (item.type === 'log') {
                        Alert.alert(item.name, item.details);
                    } else if (item.type === 'routine') {
                        Alert.alert(t('routines_title'), `${item.name} (${item.time})`);
                    } else if (item.type === 'Termin') {
                        Alert.alert(item.name, item.details || "Keine Notizen");
                    }
                }}
            >
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className={`font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.name}</Text>
                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>
                            {isAppt && item.time ? `${item.time} Uhr` : item.type}
                        </Text>
                        {item.details && !isAppt && <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>{item.details}</Text>}
                    </View>
                    {item.type === 'routine' && <Ionicons name="repeat" size={16} color="#94a3b8" />}
                    {item.type === 'log' && <Ionicons name="medical" size={16} color="#6366f1" />}
                    {isAppt && <Ionicons name="calendar" size={20} color="#8b5cf6" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`} edges={['top']}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <Text className={`text-2xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Kalender</Text>
                <TouchableOpacity onPress={loadData} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                    <Ionicons name="refresh" size={20} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <Calendar
                theme={calendarTheme}
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={{
                    ...markedDates,
                    [selectedDate]: {
                        ...(markedDates[selectedDate] || {}),
                        selected: true,
                        disableTouchEvent: true,
                    }
                }}
                markingType={'multi-dot'}
                enableSwipeMonths={true}
            />

            <View className="flex-1 pt-4 bg-transparent">
                <Text className={`px-5 mb-2 text-xs font-bold uppercase ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>
                    {selectedDate.split('-').reverse().join('.')}
                </Text>

                {selectedItems.length === 0 ? (
                    <View className="flex-1 items-center justify-center p-10">
                        <Text className="text-slate-400 italic">Keine Einträge für diesen Tag.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={selectedItems}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
