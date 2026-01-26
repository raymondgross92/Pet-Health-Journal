import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDb } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function AddPetScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [species, setSpecies] = useState('Hund');
    const [customSpecies, setCustomSpecies] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [weight, setWeight] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateOfBirth(selectedDate);
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

        setLoading(true);
        try {
            const db = await getDb();

            const finalSpecies = species === 'Andere' ? customSpecies : species;
            // Format format: DD.MM.YYYY
            const formattedDate = dateOfBirth.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            await db.runAsync(
                'INSERT INTO pets (name, breed, date_of_birth, weight, image_uri, species) VALUES (?, ?, ?, ?, ?, ?)',
                name,
                breed,
                formattedDate,
                weight ? parseFloat(weight) : null,
                image,
                finalSpecies
            );

            Alert.alert('Erfolg', 'Haustier erfolgreich gespeichert!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
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
                <Text className="text-xl font-bold text-secondary-900">Neues Haustier</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                {/* Image Picker */}
                <View className="items-center mb-8">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        <View className="h-32 w-32 bg-secondary-100 rounded-full items-center justify-center overflow-hidden border-2 border-secondary-200 border-dashed">
                            {image ? (
                                <Image source={{ uri: image }} className="h-full w-full" />
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="camera" size={32} color="#94a3b8" />
                                    <Text className="text-secondary-400 text-xs mt-1">Foto hinzufügen</Text>
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
                    placeholder="z.B. Bella"
                    value={name}
                    onChangeText={setName}
                />

                <Input
                    label="Rasse"
                    placeholder="z.B. Golden Retriever"
                    value={breed}
                    onChangeText={setBreed}
                />

                <View className="flex-row space-x-4">
                    <View className="flex-1 mb-4">
                        <Text className="text-secondary-700 font-medium mb-2 ml-1">Geburtsdatum</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-3.5 flex-row justify-between items-center"
                        >
                            <Text className="text-secondary-900">
                                {dateOfBirth.toLocaleDateString('de-DE')}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Input
                        label="Gewicht (kg)"
                        placeholder="z.B. 25"
                        keyboardType="numeric"
                        containerClassName="flex-1"
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={dateOfBirth}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}

                <View className="h-8" />

                <Button
                    label={loading ? "Speichert..." : "Speichern"}
                    onPress={handleSave}
                    disabled={loading}
                />
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
