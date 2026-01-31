import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';

export default function EditVetScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const vetId = Array.isArray(id) ? id[0] : id;
    const { t } = useLanguage();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [vetId]);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<any>('SELECT * FROM vets WHERE id = ?', [vetId]);
            if (result.length > 0) {
                const vet = result[0];
                setName(vet.name);
                setPhone(vet.phone);
                setAddress(vet.address);
                setNotes(vet.notes);
                setIsEmergency(vet.emergency === 1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Tierarzt löschen?",
            "Wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync('DELETE FROM vets WHERE id = ?', [vetId]);
                            router.back();
                        } catch (e) { console.error(e); }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Fehler", "Bitte Name eingeben.");
            return;
        }

        try {
            const db = await getDb();
            await db.runAsync(
                `UPDATE vets SET name=?, phone=?, address=?, emergency=?, notes=? WHERE id=?`,
                [name, phone, address, isEmergency ? 1 : 0, notes, vetId]
            );
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte nicht speichern.");
        }
    };

    if (loading) return <View className="flex-1 bg-white justify-center items-center"><Text>Laden...</Text></View>;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-secondary-900 font-sans">{t('vet_edit')}</Text>
                </View>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <Input label="Name / Praxis" value={name} onChangeText={setName} />
                <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Input label="Adresse" value={address} onChangeText={setAddress} />

                {address ? (
                    <TouchableOpacity
                        onPress={() => {
                            const query = encodeURIComponent(address);
                            const url = Platform.select({
                                ios: `maps:0,0?q=${query}`,
                                android: `geo:0,0?q=${query}`
                            });
                            Linking.openURL(url!);
                        }}
                        className="flex-row items-center mb-6 bg-blue-50 p-3 rounded-xl border border-blue-100"
                    >
                        <Ionicons name="map" size={20} color="#3b82f6" />
                        <Text className="ml-2 text-blue-600 font-bold">{t('open_maps')}</Text>
                    </TouchableOpacity>
                ) : null}

                <View className="flex-row justify-between items-center bg-secondary-50 p-4 rounded-xl mb-6 border border-secondary-100">
                    <View>
                        <Text className="text-secondary-900 font-bold font-sans">{t('emergency_contact')}</Text>
                        <Text className="text-secondary-500 text-xs font-sans">{t('highlighted_red')}</Text>
                    </View>
                    <Switch
                        value={isEmergency}
                        onValueChange={setIsEmergency}
                        trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                    />
                </View>

                <Input label="Notizen" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

                <Button label="Speichern" onPress={handleSave} className="mt-4" />

                <TouchableOpacity
                    onPress={() => {
                        const query = encodeURIComponent("Tierarzt Notdienst");
                        const url = Platform.select({
                            ios: `maps:0,0?q=${query}`,
                            android: `geo:0,0?q=${query}`
                        });
                        Linking.openURL(url!);
                    }}
                    className="mt-6 flex-row justify-center items-center"
                >
                    <Ionicons name="search" size={16} color="#ef4444" />
                    <Text className="text-red-500 font-bold ml-2">Notdienst in der Nähe suchen</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
