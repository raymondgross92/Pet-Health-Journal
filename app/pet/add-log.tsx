import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { setupNotifications, scheduleReminder } from '../../lib/notifications';

const LOG_TYPES = ['Tierarzt', 'Impfung', 'Medikament', 'Gewicht', 'Notiz'];

export default function AddLogScreen() {
    const { petId } = useLocalSearchParams();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [weightValue, setWeightValue] = useState('');
    const [type, setType] = useState('Notiz');
    const [date, setDate] = useState(new Date().toLocaleDateString('de-DE'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setupNotifications();
    }, []);

    // Auto-set title for Weight
    useEffect(() => {
        if (type === 'Gewicht') {
            setTitle('Gewichtsmessung');
        } else if (title === 'Gewichtsmessung') {
            setTitle('');
        }
    }, [type]);

    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('.');
        return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Titel ein');
            return;
        }

        if (type === 'Gewicht' && !weightValue.trim()) {
            Alert.alert('Fehler', 'Bitte gib ein Gewicht ein');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();

            // Validate and parse date
            const reminderDate = parseDate(date);
            const now = new Date();

            // Prepare final description
            let finalDescription = description;
            if (type === 'Gewicht') {
                finalDescription = `${weightValue} kg`;
                if (description.trim()) {
                    finalDescription += ` - ${description}`;
                }
            }

            // Save to DB
            await db.runAsync(
                'INSERT INTO logs (pet_id, title, description, date, type) VALUES (?, ?, ?, ?, ?)',
                Number(petId),
                title,
                finalDescription,
                date,
                type
            );

            // Schedule Notification if future date
            if (reminderDate > now) {
                // Schedule for 9 AM on that day
                reminderDate.setHours(9, 0, 0, 0);

                // If 9 AM is already passed today, schedule for next day or ignore (here assuming future dates)
                if (reminderDate <= now) {
                    reminderDate.setDate(reminderDate.getDate() + 1);
                }

                await scheduleReminder(
                    `Erinnerung: ${title}`,
                    `Heute steht an: ${title} (${type})`,
                    reminderDate
                );

                Alert.alert('Erfolg', 'Eintrag gespeichert & Erinnerung gesetzt!');
            } else {
                Alert.alert('Erfolg', 'Eintrag gespeichert!');
            }

            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Fehler', 'Fehler beim Speichern');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900">Neuer Eintrag</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <View className="mb-6">
                    <Text className="text-secondary-700 font-medium mb-2 ml-1">Kategorie</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
                        {LOG_TYPES.map((t) => (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setType(t)}
                                className={`px-4 py-2 rounded-full border mr-2 ${type === t
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-white border-secondary-200'
                                    }`}
                            >
                                <Text className={type === t ? 'text-white font-medium' : 'text-secondary-600'}>
                                    {t}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Input
                    label="Titel"
                    placeholder="z.B. Tollwut-Impfung"
                    value={title}
                    onChangeText={setTitle}
                />

                {type === 'Gewicht' && (
                    <Input
                        label="Gewicht (kg)"
                        placeholder="z.B. 25.5"
                        value={weightValue}
                        onChangeText={setWeightValue}
                        keyboardType="numeric"
                    />
                )}

                <Input
                    label="Datum"
                    placeholder="DD.MM.YYYY"
                    value={date}
                    onChangeText={setDate}
                />

                <Input
                    label={type === 'Gewicht' ? "Zusätzliche Notiz (Optional)" : "Beschreibung / Notiz"}
                    placeholder="Details..."
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />

                <View className="h-8" />

                <Button
                    label={loading ? "Speichert..." : "Eintrag speichern"}
                    onPress={handleSave}
                    disabled={loading}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
