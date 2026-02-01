import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import DateTimePickerInput from '../components/ui/DateTimePickerInput';
import { Pet } from '../types';
import * as Notifications from 'expo-notifications';

export default function AddRoutineScreen() {
    const router = useRouter();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetIds, setSelectedPetIds] = useState<number[]>([]);

    const [title, setTitle] = useState('');
    const [times, setTimes] = useState<Date[]>([new Date()]);
    const [type, setType] = useState('food'); // food, walk, hygiene, medication, other
    const [loading, setLoading] = useState(false);

    // Medications support
    const [meds, setMeds] = useState<any[]>([]);
    const [selectedMedId, setSelectedMedId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
        // Initialize default time to 08:00
        const d = new Date();
        d.setHours(8, 0, 0, 0);
        setTimes([d]);
    }, []);

    const loadData = async () => {
        try {
            const db = await getDb();
            const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY name ASC');
            setPets(petsResult);
            if (petsResult.length > 0) setSelectedPetIds([petsResult[0].id]);

            const medsResult = await db.getAllAsync<any>('SELECT * FROM medications ORDER BY name ASC');
            setMeds(medsResult);
        } catch (e) {
            console.error(e);
        }
    };

    const togglePet = (id: number) => {
        if (selectedPetIds.includes(id)) {
            setSelectedPetIds(selectedPetIds.filter(pid => pid !== id));
        } else {
            setSelectedPetIds([...selectedPetIds, id]);
        }
    };

    const addTime = () => {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        setTimes([...times, d]);
    };

    const removeTime = (index: number) => {
        const newTimes = [...times];
        newTimes.splice(index, 1);
        setTimes(newTimes);
    };

    const updateTime = (date: Date, index: number) => {
        const newTimes = [...times];
        newTimes[index] = date;
        setTimes(newTimes);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Titel an.');
            return;
        }
        if (selectedPetIds.length === 0) {
            Alert.alert('Fehler', 'Bitte wähle mindestens ein Haustier.');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();

            // Iterate over selected pets to create a routine for each
            for (const selectedPetId of selectedPetIds) {
                // Insert Routine (Daily by default)
                const result = await db.runAsync(
                    'INSERT INTO routines (pet_id, title, type, frequency, enabled, medication_id) VALUES (?, ?, ?, ?, 1, ?)',
                    selectedPetId, title, type, 'daily', (type === 'medication' ? selectedMedId : null)
                );

                const routineId = result.lastInsertRowId;
                const petName = pets.find(p => p.id === selectedPetId)?.name || 'Unbekanntes Tier';

                // Insert Times and schedule notifications
                for (const time of times) {
                    const timeStr = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    await db.runAsync(
                        'INSERT INTO routine_times (routine_id, time) VALUES (?, ?)',
                        routineId, timeStr
                    );

                    // Notification Logic (Daily)
                    const [hours, minutes] = timeStr.split(':').map(Number);

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Routine: ${title}`,
                            body: `Zeit für ${title} (${petName})`,
                            sound: true,
                            data: { routineId: routineId },
                        },
                        trigger: {
                            hour: hours,
                            minute: minutes,
                            repeats: true,
                        } as any,
                    });
                }
            }

            router.back();

        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Routine nicht speichern.');
        } finally {
            setLoading(false);
        }
    };

    const RoutineType = ({ id, label, icon, color }: any) => (
        <TouchableOpacity
            onPress={() => {
                setType(id);
                if (id === 'medication') setTitle('Medikament geben');
                else if (id === 'food') setTitle('Füttern');
                else if (id === 'walk') setTitle('Gassi Runde');
                else setTitle('');
            }}
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
                <Text className="text-secondary-900 font-bold mb-2 font-sans">Für welche Tiere?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => {
                        const isSelected = selectedPetIds.includes(pet.id);
                        return (
                            <TouchableOpacity
                                key={pet.id}
                                onPress={() => togglePet(pet.id)}
                                className={`mr-3 px-4 py-2 rounded-full border ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white border-secondary-200'}`}
                            >
                                <Text className={`font-bold font-sans ${isSelected ? 'text-white' : 'text-secondary-600'}`}>
                                    {pet.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <Text className="text-secondary-900 font-bold mb-3 font-sans">Was steht an?</Text>
                <View className="flex-row flex-wrap mb-4">
                    <RoutineType id="food" label="Füttern" icon="restaurant" color="#8b5cf6" />
                    <RoutineType id="walk" label="Gassi" icon="walk" color="#10b981" />
                </View>
                <View className="flex-row flex-wrap mb-6">
                    <RoutineType id="hygiene" label="Hygiene" icon="water" color="#3b82f6" />
                    <RoutineType id="medication" label="Medikament" icon="medkit" color="#ef4444" />
                    <RoutineType id="other" label="Sonstiges" icon="time" color="#f59e0b" />
                </View>

                {/* Medication Dropdown */}
                {type === 'medication' && (
                    <View className="mb-6">
                        <Text className="text-secondary-900 font-bold mb-2 font-sans">Welches Medikament?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                            {meds.map(med => (
                                <TouchableOpacity
                                    key={med.id}
                                    onPress={() => {
                                        setSelectedMedId(med.id);
                                        setTitle(`${med.name} geben`);
                                    }}
                                    className={`mr-3 p-3 rounded-xl border ${selectedMedId === med.id ? 'bg-red-50 border-red-500' : 'bg-white border-secondary-200'}`}
                                >
                                    <Text className={`font-bold ${selectedMedId === med.id ? 'text-red-700' : 'text-secondary-700'}`}>{med.name}</Text>
                                    <Text className="text-xs text-secondary-500">Vorrat: {med.stock}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

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
                                    <DateTimePickerInput
                                        value={t}
                                        mode="time"
                                        onChange={(date) => updateTime(date, index)}
                                        containerClassName="mb-0"
                                    />
                                </View>
                                <TouchableOpacity
                                    onPress={() => removeTime(index)}
                                    className="bg-red-50 p-3 rounded-xl ml-2"
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
                    label={loading ? "Speichert..." : "Speichern & Erinnerung aktivieren"}
                    onPress={handleSave}
                    disabled={loading}
                />
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
