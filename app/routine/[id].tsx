import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DateTimePickerInput from '../../components/ui/DateTimePickerInput';
import { Pet } from '../../types';
import * as Notifications from 'expo-notifications';

export default function EditRoutineScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const routineId = Array.isArray(id) ? id[0] : id;
    const [pets, setPets] = useState<Pet[]>([]);

    // Form State
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [times, setTimes] = useState<string[]>([]);
    const [type, setType] = useState('food');
    const [frequency, setFrequency] = useState('daily');
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [routineId]);

    const loadData = async () => {
        try {
            const db = await getDb();

            // Load Pets
            const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY name ASC');
            setPets(petsResult);

            // Load Routine
            const routineResult = await db.getAllAsync<any>('SELECT * FROM routines WHERE id = ?', [routineId]);
            if (routineResult.length > 0) {
                const routine = routineResult[0];
                setTitle(routine.title);
                setType(routine.type);
                setSelectedPetId(routine.pet_id);
                setFrequency(routine.frequency || 'daily');
                if (routine.date) {
                    const [day, month, year] = routine.date.split('.');
                    setDate(new Date(Number(year), Number(month) - 1, Number(day)));
                }

                // Load Times
                const timesResult = await db.getAllAsync<any>('SELECT time FROM routine_times WHERE routine_id = ?', [routineId]);
                setTimes(timesResult.map(t => t.time));
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Daten konnten nicht geladen werden.");
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
        const newTimes = [...times];
        newTimes[index] = text;
        setTimes(newTimes);
    };

    const RoutineType = ({ id, label, icon, color }: any) => (
        <TouchableOpacity
            onPress={() => { setType(id); }}
            className={`flex-1 p-4 rounded-2xl border items-center mr-2 mb-2 ${type === id ? 'bg-primary-50 border-primary-500' : 'bg-white border-secondary-100'}`}
        >
            <Ionicons name={icon} size={24} color={type === id ? color : '#94a3b8'} />
            <Text className={`font-bold mt-2 font-sans ${type === id ? 'text-primary-700' : 'text-secondary-400'}`}>{label}</Text>
        </TouchableOpacity>
    );

    const handleDelete = () => {
        Alert.alert(
            "Routine löschen?",
            "Möchtest du diese Routine wirklich unwiderruflich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync('DELETE FROM routines WHERE id = ?', [routineId]);
                            await Notifications.cancelScheduledNotificationAsync(String(routineId));
                            router.back();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel ein.");
            return;
        }

        try {
            const db = await getDb();

            // Format Date if once
            const dateStr = frequency === 'once'
                ? date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })
                : null;

            // Update Routine
            await db.runAsync(
                `UPDATE routines SET pet_id = ?, title = ?, type = ?, time = ?, frequency = ?, date = ? WHERE id = ?`,
                [selectedPetId, title, type, times[0] || '', frequency, dateStr, routineId]
            );

            // Update Times (Delete All & Re-insert)
            await db.runAsync('DELETE FROM routine_times WHERE routine_id = ?', [routineId]);

            // Insert Times & Schedule Notifications
            const petName = pets.find(p => p.id === selectedPetId)?.name || '';

            for (const time of times) {
                await db.runAsync(
                    'INSERT INTO routine_times (routine_id, time) VALUES (?, ?)',
                    [routineId, time]
                );

                const [hours, minutes] = time.split(':').map(Number);

                let trigger: any;

                if (frequency === 'daily') {
                    trigger = {
                        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                        hour: hours,
                        minute: minutes,
                        repeats: true,
                    };
                } else {
                    // Once
                    const triggerDate = new Date(date);
                    triggerDate.setHours(hours, minutes, 0, 0);

                    if (triggerDate > new Date()) {
                        trigger = { date: triggerDate };
                    }
                }

                if (trigger) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Routine: ${title}`,
                            body: `Zeit für ${title} (${petName})`,
                            sound: true,
                            data: { routineId: routineId }
                        },
                        trigger: trigger,
                    });
                }
            }

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Änderungen nicht speichern.");
        }
    };

    if (loading) return <View className="flex-1 bg-white justify-center items-center"><Text>Laden...</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-secondary-50">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center bg-white justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-secondary-900 font-sans">Routine bearbeiten</Text>
                </View>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
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

                <Text className="text-secondary-900 font-bold mb-3 font-sans">Typ</Text>
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

                {/* Frequency Removed due to stability issues */}

                {/* Times Section */}
                <View className="mb-6">
                    <Text className="text-secondary-900 font-bold mb-2 font-sans">Uhrzeiten</Text>
                    <View className="bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm">
                        {times.map((t, index) => {
                            // Parse HH:MM to Date for picker
                            const [h, m] = t.split(':').map(Number);
                            const date = new Date();
                            date.setHours(h || 0, m || 0, 0, 0);

                            return (
                                <View key={index} className="flex-row items-center mb-3">
                                    <View className="flex-1 mr-3">
                                        <DateTimePickerInput
                                            value={date}
                                            mode="time"
                                            onChange={(newDate) => {
                                                const timeStr = newDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                                                updateTime(timeStr, index);
                                            }}
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
                            );
                        })}
                        <Button
                            label="Zeit hinzufügen +"
                            variant="secondary"
                            size="sm"
                            onPress={addTime}
                        />
                    </View>
                </View>

                <Button
                    label="Speichern"
                    onPress={handleSave}
                />
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
