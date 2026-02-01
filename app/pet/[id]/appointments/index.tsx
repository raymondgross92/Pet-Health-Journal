import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import { getDb } from '../../../../db';
import EmptyState from '../../../../components/ui/EmptyState';

export default function AppointmentsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [appointments, setAppointments] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const db = await getDb();
            // Join with vets table to get vet name
            const result = await db.getAllAsync(`
                SELECT a.*, v.name as vet_name 
                FROM appointments a 
                LEFT JOIN vets v ON a.vet_id = v.id 
                WHERE a.pet_id = ? 
                ORDER BY 
                    substr(a.date, 7, 4) || substr(a.date, 4, 2) || substr(a.date, 1, 2) DESC, -- Sort by date DESC (dd.mm.yyyy)
                    a.time DESC
            `, [id]);
            setAppointments(result);
        } catch (e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleDelete = (appId: number) => {
        Alert.alert(
            "Löschen",
            "Termin wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDb();
                        await db.runAsync('DELETE FROM appointments WHERE id = ?', [appId]);
                        loadData();
                    }
                }
            ]
        );
    };

    // Separate into Upcoming and Past
    const now = new Date();
    const upcoming = appointments.filter(a => {
        const [day, month, year] = a.date.split('.');
        const d = new Date(`${year}-${month}-${day}T${a.time || '00:00'}`);
        return d >= now;
    }).reverse(); // Show soonest first

    const past = appointments.filter(a => {
        const [day, month, year] = a.date.split('.');
        const d = new Date(`${year}-${month}-${day}T${a.time || '00:00'}`);
        return d < now;
    });

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Termine & Besuche</Text>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/pet/[id]/appointments/add', params: { id } })}
                    className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                >
                    <Ionicons name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {appointments.length === 0 ? (
                    <EmptyState
                        icon="calendar-outline"
                        title="Keine Einträge"
                        description="Trage Tierarztbesuche oder Impftermine ein."
                        actionLabel="Termin hinzufügen"
                        onAction={() => router.push({ pathname: '/pet/[id]/appointments/add', params: { id } })}
                    />
                ) : (
                    <>
                        {upcoming.length > 0 && (
                            <View className="mb-6">
                                <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Demnächst</Text>
                                {upcoming.map(app => (
                                    <View key={app.id} className={`p-4 mb-3 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100 shadow-sm'}`}>
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-row items-center">
                                                <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${theme === 'dark' ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
                                                    <Ionicons name="calendar" size={20} color="#16a34a" />
                                                </View>
                                                <View>
                                                    <Text className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{app.title}</Text>
                                                    <Text className={`${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{app.date} • {app.time} Uhr</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => handleDelete(app.id)}>
                                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>

                                        {app.vet_name && (
                                            <View className="flex-row items-center mt-2 mb-2">
                                                <Ionicons name="medkit-outline" size={16} color="#64748b" />
                                                <Text className="ml-2 text-secondary-500">{app.vet_name}</Text>
                                            </View>
                                        )}

                                        {app.notes && (
                                            <View className={`mt-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-50'}`}>
                                                <Text className={`italic ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-600'}`}>{app.notes}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {past.length > 0 && (
                            <View className="pb-10">
                                <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Verlauf</Text>
                                {past.map((app, index) => (
                                    <View key={app.id} className="flex-row">
                                        {/* Timeline Line */}
                                        <View className="items-center mr-4 w-4">
                                            <View className={`w-3 h-3 rounded-full mt-6 ${theme === 'dark' ? 'bg-slate-600' : 'bg-secondary-300'}`} />
                                            {index !== past.length - 1 && (
                                                <View className={`w-0.5 flex-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-200'}`} />
                                            )}
                                        </View>

                                        <View className={`flex-1 p-4 mb-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}>
                                            <View className="flex-row justify-between">
                                                <Text className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{app.date}</Text>
                                                <TouchableOpacity onPress={() => handleDelete(app.id)}>
                                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                            <Text className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{app.title}</Text>

                                            {app.vet_name && <Text className="text-secondary-500 text-sm mb-2">bei {app.vet_name}</Text>}

                                            {app.notes ? (
                                                <Text className={`${theme === 'dark' ? 'text-slate-400' : 'text-secondary-600'}`}>{app.notes}</Text>
                                            ) : (
                                                <Text className="text-secondary-400 italic text-sm">Keine Notizen</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
