import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../../db';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import DateTimePickerInput from '../../../components/ui/DateTimePickerInput';
import { Log } from '../../../types';
import { CalendarService } from '../../../services/CalendarService';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';

export default function EditLogScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [weightValue, setWeightValue] = useState('');
    const [type, setType] = useState('Notiz');
    const [date, setDate] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getFirstAsync<Log>(
                'SELECT * FROM logs WHERE id = ?',
                Number(id)
            );

            if (result) {
                setTitle(result.title);
                // Parse DD.MM.YYYY
                const [day, month, year] = result.date.split('.');
                setDate(new Date(Number(year), Number(month) - 1, Number(day)));

                setType(result.type);

                if (result.type === 'Gewicht') {
                    // Try to parse weight from description (e.g. "25.5 kg - Note")
                    const match = result.description.match(/^([\d\.]+)/);
                    if (match) {
                        setWeightValue(match[1]);
                        // Remove weight part from description to show rest in note field
                        const rest = result.description.replace(/^[\d\.]+\s*(kg)?\s*(-)?\s*/, '');
                        setDescription(rest);
                    } else {
                        setDescription(result.description);
                    }
                } else {
                    setDescription(result.description);
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Daten nicht laden');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Eintrag löschen',
            'Möchtest du diesen Eintrag wirklich löschen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync('DELETE FROM logs WHERE id = ?', Number(id));
                            router.back();
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Fehler', 'Fehler beim Löschen');
                        }
                    }
                }
            ]
        );
    };

    const handleExportToCalendar = async () => {
        try {
            const eventDate = new Date(date);
            // Set time to something reasonable if not specified, e.g. 9 AM
            eventDate.setHours(9, 0, 0, 0);

            await CalendarService.createEvent({
                title: title,
                startDate: eventDate,
                notes: description
            });
            Alert.alert(t('success'), t('event_created'));
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('event_error'));
        }
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

        setSaving(true);
        try {
            const db = await getDb();

            // Prepare final description
            let finalDescription = description;
            if (type === 'Gewicht') {
                finalDescription = `${weightValue} kg`;
                if (description.trim()) {
                    finalDescription += ` - ${description}`;
                }
            }

            await db.runAsync(
                'UPDATE logs SET title = ?, description = ?, date = ? WHERE id = ?',
                title,
                finalDescription,
                date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                Number(id)
            );

            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Fehler', 'Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-secondary-900">Eintrag bearbeiten</Text>
                </View>
                <TouchableOpacity onPress={handleDelete} className="bg-red-50 p-2 rounded-full">
                    <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <View className="mb-6">
                    <View className={`self-start px-3 py-1 rounded-lg ${type === 'Impfung' ? 'bg-red-100' :
                        type === 'Gewicht' ? 'bg-green-100' :
                            type === 'Tierarzt' ? 'bg-blue-100' :
                                'bg-secondary-100'
                        }`}>
                        <Text className={`font-medium ${type === 'Impfung' ? 'text-red-700' :
                            type === 'Gewicht' ? 'text-green-700' :
                                type === 'Tierarzt' ? 'text-blue-700' :
                                    'text-secondary-700'
                            }`}>{type}</Text>
                    </View>
                </View>

                <Input
                    label="Titel"
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
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />

                <View className="h-8" />

                <Button
                    label={saving ? "Speichert..." : "Änderungen speichern"}
                    onPress={handleSave}
                    disabled={saving}
                />

                <Button
                    label={t('add_to_calendar')}
                    variant="secondary"
                    className="mt-4"
                    icon={<Ionicons name="calendar" size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />}
                    onPress={handleExportToCalendar}
                />

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
