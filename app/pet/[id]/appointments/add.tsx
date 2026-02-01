import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { getDb } from '../../../../db';
import Button from '../../../../components/ui/Button';
import DateTimePickerInput from '../../../../components/ui/DateTimePickerInput';
import * as Notifications from 'expo-notifications';

export default function AddAppointmentScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();

    const [title, setTitle] = useState('');
    const [vetId, setVetId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [vets, setVets] = useState<any[]>([]);

    useEffect(() => {
        loadVets();
    }, []);

    const loadVets = async () => {
        const db = await getDb();
        const result = await db.getAllAsync<any>('SELECT * FROM vets ORDER BY name ASC');
        setVets(result);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel an (z.B. Impfung, Kontrolle).");
            return;
        }

        try {
            const db = await getDb();
            const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            await db.runAsync(
                'INSERT INTO appointments (pet_id, vet_id, title, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [Number(id), vetId, title, dateStr, timeStr, notes]
            );

            // Schedule Notification if in future (1 day before and 1 hour before)
            if (date > new Date()) {
                // 1 Day before
                const dayBefore = new Date(date);
                dayBefore.setDate(dayBefore.getDate() - 1);
                dayBefore.setHours(9, 0, 0, 0); // At 9 AM

                if (dayBefore > new Date()) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Termin morgen: ${title}`,
                            body: `Denk an den Tierarzt-Termin morgen um ${timeStr}!`,
                            sound: true,
                        },
                        trigger: dayBefore as any,
                    });
                }

                // 1 Hour before
                const hourBefore = new Date(date);
                hourBefore.setHours(hourBefore.getHours() - 1);

                if (hourBefore > new Date()) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Termin in 1h: ${title}`,
                            body: `Gleich ist der Tierarzt-Termin (${timeStr})!`,
                            sound: true,
                        },
                        trigger: hourBefore as any,
                    });
                }
            }

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Termin nicht speichern.");
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Neuer Termin</Text>
            </View>

            <ScrollView className="flex-1 p-5">
                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Worum geht es?</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 font-sans text-base ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="z.B. Jahreskontrolle, Impfung..."
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Wann?</Text>
                <View className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <DateTimePickerInput
                        value={date}
                        onChange={setDate}
                        mode="datetime"
                    />
                </View>

                {vets.length > 0 && (
                    <>
                        <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Welcher Arzt? (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                            {vets.map(vet => (
                                <TouchableOpacity
                                    key={vet.id}
                                    onPress={() => setVetId(vet.id === vetId ? null : vet.id)}
                                    className={`mr-3 p-4 rounded-xl border ${vetId === vet.id
                                        ? (theme === 'dark' ? 'bg-primary-900/30 border-primary-500' : 'bg-primary-50 border-primary-500')
                                        : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100')}`}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="medkit" size={20} color={vetId === vet.id ? '#16a34a' : (theme === 'dark' ? '#94a3b8' : '#64748b')} />
                                        <Text className={`ml-2 font-bold ${vetId === vet.id ? 'text-primary-600' : (theme === 'dark' ? 'text-slate-400' : 'text-secondary-600')}`}>
                                            {vet.name}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Notizen</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 font-sans text-base min-h-[120px] ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="Befunde, Anweisungen, Kosten..."
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    textAlignVertical="top"
                />

                <Button label="Termin speichern" onPress={handleSave} size="lg" />
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
