import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Pet } from '../../types';
import * as Notifications from 'expo-notifications';

export default function EditMedicationScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const medId = Array.isArray(id) ? id[0] : id;
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('3');
    const [notes, setNotes] = useState('');
    const [times, setTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [medId]);

    const loadData = async () => {
        try {
            const db = await getDb();
            const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY name ASC');
            setPets(petsResult);

            const medResult = await db.getAllAsync<any>('SELECT * FROM medications WHERE id = ?', [medId]);
            if (medResult.length > 0) {
                const med = medResult[0];
                setName(med.name);
                setDosage(med.dosage);
                setStock(String(med.stock));
                setMinStock(String(med.min_stock || 3));
                setNotes(med.notes);
                setSelectedPetId(med.pet_id);

                const timesResult = await db.getAllAsync<any>('SELECT time FROM medication_times WHERE medication_id = ?', [medId]);
                setTimes(timesResult.map(t => t.time));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addTime = () => setTimes([...times, "12:00"]);

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

    const handleDelete = () => {
        Alert.alert(
            "Medikament löschen?",
            "Wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync('DELETE FROM medications WHERE id = ?', [medId]);
                            router.back();
                        } catch (e) { console.error(e); }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) return Alert.alert("Fehler", "Bitte Name eingeben.");

        try {
            const db = await getDb();

            await db.runAsync(
                `UPDATE medications SET pet_id=?, name=?, dosage=?, frequency=?, stock=?, min_stock=?, notes=? WHERE id=?`,
                [
                    selectedPetId,
                    name,
                    dosage,
                    times.length + 'x tgl.',
                    parseInt(stock) || 0,
                    parseInt(minStock) || 3,
                    notes,
                    medId
                ]
            );

            // Update Times
            await db.runAsync('DELETE FROM medication_times WHERE medication_id = ?', [medId]);

            const petName = pets.find(p => p.id === selectedPetId)?.name || 'Dein Haustier';

            for (const time of times) {
                await db.runAsync(
                    'INSERT INTO medication_times (medication_id, time) VALUES (?, ?)',
                    [medId, time]
                );

                const [hours, minutes] = time.split(':').map(Number);
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `Medikamente für ${petName}`,
                        body: `Zeit für ${name} (${dosage})`,
                        data: { medId: medId },
                    },
                    trigger: {
                        hour: hours,
                        minute: minutes,
                        repeats: true,
                    } as any,
                });
            }

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Speichern fehlgeschlagen.");
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
                    <Text className="text-xl font-bold text-secondary-900 font-sans">Medikament bearbeiten</Text>
                </View>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                {/* Pet Selection Logic Same as Add (Simplified here for brevity but assuming user doesn't change pet often, but accessible) */}
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
                    <Input label="Name" value={name} onChangeText={setName} />
                    <Input label="Dosierung" value={dosage} onChangeText={setDosage} />
                </View>

                {/* Times */}
                <View className="mb-6">
                    <Text className="text-secondary-900 font-bold mb-2 font-sans">Erinnerungen</Text>
                    <View className="bg-white p-4 rounded-2xl border border-secondary-100 shadow-sm">
                        {times.map((time, index) => (
                            <View key={index} className="flex-row items-center mb-3">
                                <View className="flex-1 mr-3">
                                    <Input value={time} onChangeText={(t) => updateTime(t, index)} placeholder="HH:MM" />
                                </View>
                                <TouchableOpacity onPress={() => removeTime(index)} className="bg-red-50 p-2 rounded-full">
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <Button label="Zeit hinzufügen +" variant="secondary" size="sm" onPress={addTime} />
                    </View>
                </View>

                {/* Stock */}
                <View className="bg-white p-4 rounded-2xl border border-secondary-100 mb-6 shadow-sm">
                    <View className="flex-row space-x-4">
                        <View className="flex-1"><Input label="Bestand" value={stock} onChangeText={setStock} keyboardType="numeric" /></View>
                        <View className="flex-1"><Input label="Warnung ab" value={minStock} onChangeText={setMinStock} keyboardType="numeric" /></View>
                    </View>
                </View>

                <Input label="Notizen" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

                <Button label="Speichern" onPress={handleSave} className="mt-4 mb-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
