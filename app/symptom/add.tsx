import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DateTimePickerInput from '../../components/ui/DateTimePickerInput';
import { Pet } from '../../types';
import * as ImagePicker from 'expo-image-picker';

export default function AddSymptomScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const preSelectedPetId = params.petId ? Number(params.petId) : null;

    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(preSelectedPetId);

    const [title, setTitle] = useState('');
    const [severity, setSeverity] = useState(3); // Default mild
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [image, setImage] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDb();
        const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets');
        setPets(petsResult);

        if (!selectedPetId && petsResult.length > 0) {
            setSelectedPetId(petsResult[0].id);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Fehler', 'Bitte gib das Symptom ein (z.B. Humpeln).');
            return;
        }
        if (!selectedPetId) {
            Alert.alert('Fehler', 'Bitte wähle ein Haustier.');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            const formattedDate = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const formattedTime = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            await db.runAsync(
                'INSERT INTO symptoms (pet_id, title, severity, date, time, notes, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?)',
                selectedPetId, title, severity, formattedDate, formattedTime, notes, image
            );

            router.back();

        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Eintrag nicht speichern.');
        } finally {
            setLoading(false);
        }
    };

    const renderSeveritySelector = () => {
        // Simple visual selector 1-10
        return (
            <View className="mb-6">
                <Text className="text-secondary-700 font-medium mb-2 ml-1">Schweregrad: {severity}/10</Text>
                <View className="flex-row justify-between rounded-xl bg-secondary-100 p-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <TouchableOpacity
                            key={num}
                            onPress={() => setSeverity(num)}
                            className={`h-8 w-8 items-center justify-center rounded-lg ${severity === num
                                    ? (num > 7 ? 'bg-red-500' : num > 4 ? 'bg-orange-500' : 'bg-green-500')
                                    : 'bg-transparent'
                                }`}
                        >
                            <Text className={`font-bold text-xs ${severity === num ? 'text-white' : 'text-secondary-500'}`}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View className="flex-row justify-between mt-1 px-1">
                    <Text className="text-xs text-secondary-400">Leicht</Text>
                    <Text className="text-xs text-secondary-400">Mittel</Text>
                    <Text className="text-xs text-secondary-400">Schwer</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900">Symptom erfassen</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Pet Selection */}
                <Text className="text-secondary-700 font-medium mb-3 ml-1">Betroffenes Tier</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            className={`mr-3 items-center ${selectedPetId === pet.id ? 'opacity-100' : 'opacity-50'}`}
                        >
                            <View className={`h-16 w-16 rounded-full overflow-hidden border-2 ${selectedPetId === pet.id ? 'border-primary-500' : 'border-transparent'}`}>
                                <Image source={pet.image_uri ? { uri: pet.image_uri } : { uri: 'https://placehold.co/100' }} className="h-full w-full" />
                            </View>
                            <Text className={`text-xs mt-1 font-bold ${selectedPetId === pet.id ? 'text-primary-600' : 'text-secondary-500'}`}>{pet.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Input
                    label="Symptom"
                    placeholder="z.B. Durchfall, Humpeln, Juckreiz"
                    value={title}
                    onChangeText={setTitle}
                />

                {renderSeveritySelector()}

                <View className="flex-row space-x-4 mb-2">
                    <View className="flex-1">
                        <DateTimePickerInput
                            label="Datum"
                            value={date}
                            onChange={setDate}
                        />
                    </View>
                    <View className="flex-1">
                        <DateTimePickerInput
                            label="Uhrzeit"
                            mode="time"
                            value={time}
                            onChange={setTime}
                        />
                    </View>
                </View>

                {/* Image Picker */}
                <View className="mb-6">
                    <Text className="text-secondary-700 font-medium mb-2 ml-1">Foto (Optional)</Text>
                    <TouchableOpacity onPress={pickImage} className="h-40 bg-secondary-50 border-2 border-dashed border-secondary-200 rounded-xl items-center justify-center overflow-hidden">
                        {image ? (
                            <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
                        ) : (
                            <View className="items-center">
                                <Ionicons name="camera" size={32} color="#94a3b8" />
                                <Text className="text-secondary-400 text-xs mt-2">Foto hinzufügen</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Input
                    label="Notizen / Beobachtungen"
                    placeholder="Details..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    className="h-24"
                    textAlignVertical="top"
                />

                <Button
                    label={loading ? "Speichert..." : "Eintrag speichern"}
                    onPress={handleSave}
                    disabled={loading}
                />
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
