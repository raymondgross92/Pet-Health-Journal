import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getDb } from '../../../db';
import { Vaccination } from '../../../types';
import Button from '../../../components/ui/Button';
import * as Sharing from 'expo-sharing';

export default function VaccinationsListScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

    // Convert id to number safely
    const petId = Number(id);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<Vaccination>(
                'SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY date DESC',
                petId
            );
            setVaccinations(result);
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Impfungen konnten nicht geladen werden.");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const handleDelete = (vaccinationId: number) => {
        Alert.alert(
            "Löschen",
            "Impfung wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDb();
                        await db.runAsync('DELETE FROM vaccinations WHERE id = ?', [vaccinationId]);
                        loadData();
                    }
                }
            ]
        );
    };

    const openDocument = async (uri: string) => {
        if (!uri) return;
        try {
            await Sharing.shareAsync(uri);
        } catch (e) {
            Alert.alert("Info", "Dokument kann nicht geöffnet werden.");
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Impfpass</Text>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/vaccinations/add', params: { petId: id } })}
                    className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                >
                    <Ionicons name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {vaccinations.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <View className={`p-6 rounded-full mb-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-100'}`}>
                            <Ionicons name="medkit" size={48} color={theme === 'dark' ? '#475569' : '#94a3b8'} />
                        </View>
                        <Text className={`text-center mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Keine Impfungen eingetragen.</Text>
                    </View>
                ) : (
                    vaccinations.map((vac) => {
                        const isFuture = vac.next_due ? new Date().setHours(0, 0, 0, 0) < new Date(vac.next_due.split('.').reverse().join('-')).getTime() : false;

                        return (
                            <TouchableOpacity
                                key={vac.id}
                                onLongPress={() => handleDelete(vac.id)}
                                className={`p-5 mb-4 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View>
                                        <Text className={`text-lg font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{vac.name}</Text>
                                        <Text className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Geimpft am: {vac.date}</Text>
                                    </View>
                                    {vac.document_uri && (
                                        <TouchableOpacity onPress={() => openDocument(vac.document_uri!)}>
                                            <Ionicons name="document-attach" size={24} color="#8b5cf6" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {vac.next_due && (
                                    <View className={`mt-3 p-3 rounded-xl flex-row items-center space-x-2 ${theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                        <Ionicons name="calendar" size={16} color="#6366f1" />
                                        <Text className={`font-bold text-sm ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>Nächste: {vac.next_due}</Text>
                                    </View>
                                )}

                                {vac.notes && (
                                    <Text className={`mt-2 text-sm italic ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{vac.notes}</Text>
                                )}
                            </TouchableOpacity>
                        )
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
