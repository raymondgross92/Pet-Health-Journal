import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { getDb } from '../db';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function AddVetScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Namen ein (z.B. Praxis Dr. Müller).");
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            await db.runAsync(
                `INSERT INTO vets (name, phone, address, emergency, notes) VALUES (?, ?, ?, ?, ?)`,
                [name, phone, address, isEmergency ? 1 : 0, notes]
            );
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Tierarzt nicht speichern.");
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
                <Text className="text-xl font-bold text-secondary-900 font-sans">Neuer Tierarzt</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <Input
                    label="Name / Praxis"
                    placeholder="Dr. Müller / Tierklinik Nord"
                    value={name}
                    onChangeText={setName}
                />
                <Input
                    label="Telefon"
                    placeholder="030 123456"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <Input
                    label="Adresse"
                    placeholder="Musterstraße 1, 12345 Berlin"
                    value={address}
                    onChangeText={setAddress}
                />

                <View className="flex-row justify-between items-center bg-secondary-50 p-4 rounded-xl mb-6 border border-secondary-100">
                    <View>
                        <Text className="text-secondary-900 font-bold font-sans">Notfall-Kontakt?</Text>
                        <Text className="text-secondary-500 text-xs font-sans">Wird rot hervorgehoben</Text>
                    </View>
                    <Switch
                        value={isEmergency}
                        onValueChange={setIsEmergency}
                        trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                    />
                </View>

                <Input
                    label="Notizen"
                    placeholder="Sprechzeiten, Spezialisierung..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                />

                <Button
                    label={loading ? "Speichert..." : "Speichern"}
                    onPress={handleSave}
                    disabled={loading}
                    className="mt-4"
                />
            </ScrollView>
        </SafeAreaView>
    );
}
