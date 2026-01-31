import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DateTimePickerInput from '../../components/ui/DateTimePickerInput';
import { setupNotifications, scheduleReminder } from '../../lib/notifications';
import { CalendarService } from '../../services/CalendarService';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Switch } from 'react-native';

const LOG_TYPES = ['Tierarzt', 'Impfung', 'Medikament', 'Gewicht', 'Notiz'];

export default function AddLogScreen() {
    const { petId } = useLocalSearchParams();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [weightValue, setWeightValue] = useState('');
    const [type, setType] = useState('Notiz');
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [addToCalendar, setAddToCalendar] = useState(false);
    const { theme } = useTheme();
    const { t } = useLanguage();

    // Vet Logic
    const [vets, setVets] = useState<any[]>([]);
    const [selectedVetId, setSelectedVetId] = useState<number | null>(null);

    useEffect(() => {
        setupNotifications();
        loadVets();
    }, []);

    const loadVets = async () => {
        const db = await getDb();
        const result = await db.getAllAsync<any>('SELECT * FROM vets ORDER BY name ASC');
        setVets(result || []);
    };

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

            // Format Date for DB
            const formattedDate = date.toLocaleDateString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

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
                'INSERT INTO logs (pet_id, title, description, date, type, vet_id) VALUES (?, ?, ?, ?, ?, ?)',
                Number(petId),
                title,
                finalDescription,
                formattedDate,
                type,
                type === 'Tierarzt' ? selectedVetId : null
            );

            // Schedule Notification if future date
            // Create a copy for reminder set to 9 AM
            const reminderDate = new Date(date);
            const now = new Date();

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

            // Sync with Calendar if checked
            if (addToCalendar && reminderDate >= now) {
                try {
                    await CalendarService.createEvent({
                        title: title,
                        startDate: reminderDate,
                        notes: description
                    });
                    // Silent success or optional toast
                } catch (e) {
                    Alert.alert(t('error'), t('event_error'));
                }
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

                <DateTimePickerInput
                    label="Datum"
                    value={date}
                    onChange={setDate}
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

                {type === 'Tierarzt' && (
                    <View className="mb-6">
                        <Text className="text-secondary-700 font-medium mb-2 ml-1">Tierarzt auswählen (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row space-x-2">
                            {vets && vets.length > 0 ? (
                                vets.map((v) => (
                                    <TouchableOpacity
                                        key={v.id}
                                        onPress={() => setSelectedVetId(selectedVetId === v.id ? null : v.id)}
                                        className={`px-4 py-2 rounded-full border mr-2 ${selectedVetId === v.id
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-secondary-200'
                                            }`}
                                    >
                                        <Text className={selectedVetId === v.id ? 'text-white font-medium' : 'text-secondary-600'}>
                                            {v.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text className="text-secondary-400 italic ml-1">Keine Tierärzte gefunden. Füge einen unter "Notfall" hinzu.</Text>
                            )}
                        </ScrollView>
                    </View>
                )}

                <View className="flex-row items-center justify-between mb-6 p-4 rounded-xl border border-secondary-200 bg-secondary-50">
                    <View>
                        <Text className="font-bold text-secondary-900">{t('add_to_calendar')}</Text>
                        <Text className="text-xs text-secondary-500">Erstellt einen Termin im System-Kalender</Text>
                    </View>
                    <Switch
                        value={addToCalendar}
                        onValueChange={setAddToCalendar}
                        trackColor={{ false: "#cbd5e1", true: "#059669" }}
                    />
                </View>

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
