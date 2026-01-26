import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Pet } from '../types';
import * as Notifications from 'expo-notifications';

export default function AddRoutineScreen() {
    const router = useRouter();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [times, setTimes] = useState<string[]>(['08:00']);
    const [type, setType] = useState('food'); // food, walk, hygiene, other

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY name ASC');
            setPets(result);
            if (result.length > 0) setSelectedPetId(result[0].id);
        } catch (e) {
            console.error(e);
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
        const newTimes = [...times];
        newTimes[index] = text;
        setTimes(newTimes);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel ein (z.B. Füttern).");
            return;
        }

        try {
            const db = await getDb();
            // Insert Routine (store 1st time as fallback/primary)
            const result = await db.runAsync(
                `INSERT INTO routines (pet_id, title, type, time) VALUES (?, ?, ?, ?)`,
                [selectedPetId, title, type, times[0] || '']
            );

            const routineId = result.lastInsertRowId;
            const petName = pets.find(p => p.id === selectedPetId)?.name || '';

            // Process Times
            for (const time of times) {
                // Save to DB
                await db.runAsync(
                    'INSERT INTO routine_times (routine_id, time) VALUES (?, ?)',
                    [routineId, time]
                );

                // Schedule Notification
                const [hours, minutes] = time.split(':').map(Number);

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `Routine: ${title}`,
                        body: `Zeit für ${title} (${petName})`,
                        sound: true,
                        data: { routineId }
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        hour: hours,
                        minute: minutes,
                        repeats: true,
                    },
                });
            }

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Routine nicht speichern.");
        }
    };

    const RoutineType = ({ id, label, icon, color }: any) => (
        <TouchableOpacity
            onPress={() => { setType(id); setTitle(label); }}
            className={`flex-1 p-4 rounded-2xl border items-center mr-2 mb-2 ${type === id ? 'bg-primary-50 border-primary-500' : 'bg-white border-secondary-100'}`}
        >
            <Ionicons name={icon} size={24} color={type === id ? color : '#94a3b8'} />
            <Text className={`font-bold mt-2 font-sans ${type === id ? 'text-primary-700' : 'text-secondary-400'}`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-secondary-50">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900 font-sans">Neue Routine</Text>
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

                <Text className="text-secondary-900 font-bold mb-3 font-sans">Was steht an?</Text>
                <View className="flex-row flex-wrap mb-4">
                    <RoutineType id="food" label="Füttern" icon="restaurant" color="#8b5cf6" />
                    <RoutineType id="walk" label="Gassi" icon="walk" color="#10b981" />
                </View>
                <View className="flex-row flex-wrap mb-6">
                    <RoutineType id="hygiene" label="Hygiene" icon="water" color="#3b82f6" />
                    <RoutineType id="other" label="Sonstiges" icon="time" color="#f59e0b" />
                </View>

                <View className="bg-white p-4 rounded-2xl border border-secondary-100 mb-6 shadow-sm">
                    <Input
                        label="Bezeichnung"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Times Section */}
                <View className="mb-6">
                    <Text className="text-secondary-900 font-bold mb-2 font-sans">Uhrzeiten</Text>
                    <View className="bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm">
                        {times.map((t, index) => (
                            <View key={index} className="flex-row items-center mb-3">
                                <View className="flex-1 mr-3">
                                    <Input
                                        placeholder="HH:MM"
                                        value={t}
                                        onChangeText={(text) => updateTime(text, index)}
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

                <Button
                    label="Speichern & Erinnerung aktivieren"
                    onPress={handleSave}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
