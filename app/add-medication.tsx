import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Pet } from '../types';
import * as Notifications from 'expo-notifications';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

// Helper to schedule notifications
async function scheduleMedicationReminder(medId: number, title: string, body: string, timeStr: string) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Check permissions
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted && !settings.canAskAgain) return;
    if (!settings.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) return;
    }

    // Schedule
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            data: { medId },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: hours,
            minute: minutes,
            repeats: true,
        },
    });
}

export default function AddMedicationScreen() {
    const router = useRouter();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('3');
    const [notes, setNotes] = useState('');

    // Times
    const [times, setTimes] = useState<string[]>(['08:00']);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY name ASC');
            setPets(result);
            if (result.length > 0) {
                setSelectedPetId(result[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addTime = () => {
        setTimes([...times, "12:00"]);
    };

    const removeTime = (index: number) => {
        const newTimes = [...times];
        newTimes.splice(index, 1);
        setTimes(newTimes);
    };

    const updateTime = (text: string, index: number) => {
        // Simple text validation could be added here
        const newTimes = [...times];
        newTimes[index] = text;
        setTimes(newTimes);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Medikamentennamen ein.");
            return;
        }
        if (!selectedPetId) {
            Alert.alert("Fehler", "Bitte wähle ein Haustier aus.");
            return;
        }

        try {
            const db = await getDb();
            const result = await db.runAsync(
                `INSERT INTO medications (pet_id, name, dosage, frequency, stock, min_stock, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    selectedPetId,
                    name,
                    dosage,
                    times.length + 'x tgl.', // Fallback legacy text
                    parseInt(stock) || 0,
                    parseInt(minStock) || 3,
                    notes
                ]
            );

            const medId = result.lastInsertRowId;
            const petName = pets.find(p => p.id === selectedPetId)?.name || 'Dein Haustier';

            // Insert Times & Schedule Notifications
            for (const time of times) {
                // Save to DB
                await db.runAsync(
                    'INSERT INTO medication_times (medication_id, time) VALUES (?, ?)',
                    [medId, time]
                );

                // Schedule Notification
                await scheduleMedicationReminder(
                    medId,
                    `Medikamente für ${petName}`,
                    `Zeit für ${name} (${dosage})`,
                    time
                );
            }

            Alert.alert("Gespeichert", "Erinnerungen wurden aktiviert!");
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Medikament nicht speichern.");
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-secondary-50">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900 font-sans">Neues Medikament</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Pet Selection */}
                <Text className="text-secondary-900 font-bold mb-2 font-sans">Für welches Tier?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            className={`mr-3 px-4 py-2 rounded-full border ${selectedPetId === pet.id ? 'bg-primary-500 border-primary-500' : 'bg-white border-secondary-200'}`}
                        >
                            <Text className={`font-bold font-sans ${selectedPetId === pet.id ? 'text-white' : 'text-secondary-600'}`}>
                                {pet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="bg-white p-4 rounded-2xl border border-secondary-100 mb-6 shadow-sm">
                    <Input
                        label="Name des Medikaments"
                        placeholder="z.B. Herztablette"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        label="Dosierung"
                        placeholder="z.B. 1 Tablette"
                        value={dosage}
                        onChangeText={setDosage}
                    />
                </View>

                {/* Times Section */}
                <View className="mb-6">
                    <Text className="text-secondary-900 font-bold mb-2 font-sans">Erinnerungen (Täglich)</Text>
                    <View className="bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm">
                        {times.map((time, index) => (
                            <View key={index} className="flex-row items-center mb-3">
                                <View className="flex-1 mr-3">
                                    <Input
                                        placeholder="HH:MM"
                                        value={time}
                                        onChangeText={(t) => updateTime(t, index)}
                                        keyboardType="numbers-and-punctuation"
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => removeTime(index)}
                                    className="bg-red-50 p-2 rounded-full"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <Button
                            label="Zeit hinzufügen +"
                            variant="secondary"
                            size="sm"
                            onPress={addTime}
                        />
                    </View>
                </View>

                {/* Stock Section */}
                <View className="bg-white p-4 rounded-2xl border border-secondary-100 mb-6 shadow-sm">
                    <View className="flex-row space-x-4">
                        <View className="flex-1">
                            <Input
                                label="Aktueller Bestand"
                                placeholder="z.B. 20"
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Warnung ab"
                                placeholder="z.B. 3"
                                value={minStock}
                                onChangeText={setMinStock}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                <Input
                    label="Notizen"
                    placeholder="Einnahmehinweise etc."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                />

                <Button
                    label="Speichern & Erinnerungen aktivieren"
                    onPress={handleSave}
                    className="mt-4 mb-10"
                />
            </ScrollView>
        </SafeAreaView>
    );
}
