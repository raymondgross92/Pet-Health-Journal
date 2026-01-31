import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getDb } from '../../../db';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import DateTimePickerInput from '../../../components/ui/DateTimePickerInput';
import { Pet } from '../../../types';

export default function EditPetScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [species, setSpecies] = useState('Hund');
    const [customSpecies, setCustomSpecies] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [weight, setWeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [image, setImage] = useState<string | null>(null);



    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getFirstAsync<Pet>(
                'SELECT * FROM pets WHERE id = ?',
                Number(id)
            );
            if (result) {
                setName(result.name);
                setBreed(result.breed);

                // Check if species is a standard one
                const standardSpecies = ['Hund', 'Katze', 'Vogel'];
                if (standardSpecies.includes(result.species || 'Hund')) {
                    setSpecies(result.species || 'Hund');
                } else {
                    setSpecies('Andere');
                    setCustomSpecies(result.species || '');
                }

                if (result.date_of_birth) {
                    // Try to parse 'DD.MM.YYYY' or 'YYYY-MM-DD' depending on what's in DB
                    // Assuming 'DD.MM.YYYY' based on AddPet logic
                    const parts = result.date_of_birth.split('.');
                    if (parts.length === 3) {
                        const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                        setDateOfBirth(date);
                    } else {
                        // Fallback/Legacy
                        setDateOfBirth(new Date());
                    }
                }

                setWeight(result.weight ? result.weight.toString() : '');
                setTargetWeight(result.target_weight ? result.target_weight.toString() : '');
                setTargetWeight(result.target_weight ? result.target_weight.toString() : '');
                setImage(result.image_uri || null);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Daten nicht laden');
        } finally {
            setLoading(false);
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
        if (!name.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Namen ein');
            return;
        }

        if (species === 'Andere' && !customSpecies.trim()) {
            Alert.alert('Fehler', 'Bitte gib die Tierart ein');
            return;
        }

        setSaving(true);
        try {
            const db = await getDb();
            const finalSpecies = species === 'Andere' ? customSpecies : species;

            const formattedDate = dateOfBirth.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            await db.runAsync(
                'UPDATE pets SET name = ?, breed = ?, date_of_birth = ?, weight = ?, image_uri = ?, species = ?, target_weight = ? WHERE id = ?',
                name,
                breed,
                formattedDate,
                weight ? parseFloat(weight) : null,
                image,
                finalSpecies,
                targetWeight ? parseFloat(targetWeight) : null,
                Number(id)
            );

            Alert.alert('Erfolg', 'Änderungen gespeichert!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
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
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900">Bearbeiten</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <View className="items-center mb-8">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        <View className="h-32 w-32 bg-secondary-100 rounded-full items-center justify-center overflow-hidden border-2 border-secondary-200 border-dashed">
                            {image ? (
                                <Image source={{ uri: image }} className="h-full w-full" />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="camera" size={32} color="#94a3b8" />
                                    <Text className="text-secondary-400 text-xs mt-1">Foto ändern</Text>
                                </View>
                            )}
                        </View>
                        <View className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full border-2 border-white">
                            <Ionicons name="pencil" size={16} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="mb-4">
                    <Text className="text-secondary-700 font-medium mb-2 ml-1">Tierart</Text>
                    <View className="flex-row space-x-3 mb-4">
                        {['Hund', 'Katze', 'Vogel', 'Andere'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setSpecies(type)}
                                className={`px-4 py-2 rounded-full border ${species === type
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-white border-secondary-200'
                                    }`}
                            >
                                <Text className={species === type ? 'text-white font-medium' : 'text-secondary-600'}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {species === 'Andere' && (
                        <Input
                            label="Welche Tierart?"
                            placeholder="z.B. Hamster"
                            value={customSpecies}
                            onChangeText={setCustomSpecies}
                        />
                    )}
                </View>

                <Input
                    label="Name"
                    value={name}
                    onChangeText={setName}
                />

                <Input
                    label="Rasse"
                    value={breed}
                    onChangeText={setBreed}
                />

                <View className="flex-row space-x-4">
                    <View className="flex-1 mb-4">
                        <DateTimePickerInput
                            label="Geburtsdatum"
                            value={dateOfBirth}
                            onChange={setDateOfBirth}
                        />
                    </View>

                    <Input
                        label="Gewicht (kg)"
                        keyboardType="numeric"
                        containerClassName="flex-1"
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>

                <Input
                    label="Zielgewicht (kg) (Optional)"
                    placeholder="z.B. 23"
                    keyboardType="numeric"
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                />

                <View className="h-8" />

                <Button
                    label={saving ? "Speichert..." : "Änderungen speichern"}
                    onPress={handleSave}
                    disabled={saving}
                />
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
