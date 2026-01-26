import { View, Text, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getDb } from '../../db';
import { ReminderLog } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface Medication {
    id: number;
    name: string;
    stock: number;
    pet_name: string;
}

import { Linking as RNLinking } from 'react-native';

export default function Dashboard() {
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [upcoming, setUpcoming] = useState<ReminderLog | null>(null);
    const [recent, setRecent] = useState<ReminderLog[]>([]);
    const [lowStockMeds, setLowStockMeds] = useState<Medication[]>([]);
    const [emergencyVet, setEmergencyVet] = useState<{ id: number; name: string; phone: string } | null>(null);

    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('.');
        return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const loadData = async () => {
        try {
            const db = await getDb();
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // 1. Logs
            const allLogs = await db.getAllAsync<any>(`
                SELECT logs.*, pets.name as pet_name 
                FROM logs 
                JOIN pets ON logs.pet_id = pets.id 
                ORDER BY logs.date ASC
            `);

            const futureLogs = allLogs.filter(log => {
                const date = parseDate(log.date);
                return date >= now;
            });

            const pastLogs = allLogs.filter(log => {
                const date = parseDate(log.date);
                return date <= now;
            }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

            setUpcoming(futureLogs.length > 0 ? futureLogs[0] : null);
            setRecent(pastLogs.slice(0, 5));

            // 2. Medications Low Stock (< 5)
            const lowMeds = await db.getAllAsync<Medication>(`
                SELECT medications.id, medications.name, medications.stock, pets.name as pet_name
                FROM medications
                JOIN pets ON medications.pet_id = pets.id
                WHERE medications.stock <= 5
                ORDER BY medications.stock ASC
            `);
            setLowStockMeds(lowMeds);

            // 3. Emergency Vet
            const emVet = await db.getAllAsync<any>('SELECT * FROM vets WHERE emergency = 1 LIMIT 1');
            console.log('Emergency Vet loaded:', emVet);
            setEmergencyVet(emVet.length > 0 ? emVet[0] : null);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-secondary-50">
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <ScrollView className="flex-1 px-5 pt-5">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('welcome')}</Text>
                        <Text className={`text-2xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Raymond</Text>
                    </View>
                    <View className="flex-row space-x-3">
                        {emergencyVet && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (emergencyVet.phone) {
                                        RNLinking.openURL(`tel:${emergencyVet.phone}`);
                                    } else {
                                        Alert.alert("Fehler", "Keine Telefonnummer hinterlegt.");
                                    }
                                }}
                                className="h-10 px-3 bg-red-500 rounded-full flex-row items-center justify-center shadow-sm shadow-red-200 active:bg-red-600"
                            >
                                <Ionicons name="call" size={18} color="white" className="mr-1" />
                                <Text className="text-white font-bold text-xs ml-1">Notfall</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            className="h-10 w-10 bg-primary-100 rounded-full items-center justify-center active:bg-primary-200"
                        >
                            <Ionicons name="settings-outline" size={20} color="#8b5cf6" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Medication Alerts (if any) */}
                {lowStockMeds.length > 0 && (
                    <View className="mb-6">
                        <Text className={`font-bold mb-3 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Apotheke (Niedriger Bestand)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {lowStockMeds.map(med => (
                                <TouchableOpacity
                                    key={med.id}
                                    onPress={() => router.push('/(tabs)/care')}
                                    className={`mr-3 p-3 rounded-2xl border flex-row items-center space-x-3 shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-red-900/30' : 'bg-white border-red-100'}`}
                                >
                                    <View className={`h-8 w-8 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100'}`}>
                                        <Ionicons name="alert" size={16} color="#ef4444" />
                                    </View>
                                    <View>
                                        <Text className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{med.name}</Text>
                                        <Text className="text-red-500 text-xs font-bold">Nur noch {med.stock} ({med.pet_name})</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Quick Stats / Highlights */}
                {upcoming ? (
                    <View className="mb-8">
                        <Text className={`text-lg font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('next_event')}</Text>
                        <View className={`rounded-3xl p-6 shadow-md ${theme === 'dark' ? 'shadow-none bg-primary-600' : 'bg-primary-500 shadow-primary-200'}`}>
                            <Text className="text-primary-100 font-medium mb-1 font-sans">{t('next_reminder')}</Text>
                            <Text className="text-white text-xl font-bold mb-4 font-sans">{upcoming.pet_name}'s {upcoming.title}</Text>
                            <View className="flex-row items-center space-x-2 bg-primary-600/50 self-start px-3 py-1.5 rounded-lg">
                                <Ionicons name="calendar" size={16} color="#ede9fe" />
                                <Text className="text-primary-50 text-sm font-bold">{upcoming.date}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className={`rounded-3xl p-6 mb-8 shadow-md ${theme === 'dark' ? 'shadow-none bg-primary-600' : 'bg-primary-500 shadow-primary-200'}`}>
                        <Text className="text-primary-100 font-medium mb-1 font-sans">{t('all_done')}</Text>
                        <Text className="text-white text-xl font-bold mb-4 font-sans">{t('no_upcoming')}</Text>
                    </View>
                )}

                {/* Quick Actions */}
                <Text className={`text-lg font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('quick_actions')}</Text>
                <View className="flex-row space-x-4 mb-8">
                    <Button
                        label={t('entry_add')}
                        className="flex-1"
                        onPress={() => router.push('/(tabs)/pets')}
                        icon={<Ionicons name="add" size={20} color="white" />}
                    />
                    <Button
                        label={t('new_pet')}
                        variant="secondary"
                        className="flex-1"
                        onPress={() => router.push('/add-pet')}
                    />
                </View>

                {/* Expenses Widget */}
                <TouchableOpacity
                    onPress={() => router.push('/expenses')}
                    className={`flex-row items-center justify-between p-4 mb-8 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                >
                    <View className="flex-row items-center space-x-4">
                        <View className={`h-12 w-12 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-indigo-900/50' : 'bg-indigo-50'}`}>
                            <Ionicons name="wallet" size={24} color={theme === 'dark' ? '#818cf8' : '#6366f1'} />
                        </View>
                        <View>
                            <Text className={`font-bold text-lg font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Ausgaben</Text>
                            <Text className={`text-xs font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Tracke Futter, Tierarzt & mehr</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#64748b' : '#cbd5e1'} />
                </TouchableOpacity>

                {/* Recent Activity */}
                <Text className={`text-lg font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('recent_activity')}</Text>
                <View className={`rounded-2xl p-4 shadow-sm border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}>
                    {recent.length === 0 ? (
                        <EmptyState
                            icon="time-outline"
                            title={t('no_activities')}
                            description="Erledigte Aufgaben erscheinen hier."
                        />
                    ) : (
                        recent.map((log, index) => (
                            <View key={log.id}>
                                <ActivityItem
                                    title={log.title}
                                    subtitle={`${log.date} • ${log.pet_name}`}
                                    icon={log.type === 'Impfung' ? 'medkit' : log.type === 'Gewicht' ? 'scale' : 'paw'}
                                    color={log.type === 'Impfung' ? '#ef4444' : '#10b981'}
                                    bg={log.type === 'Impfung' ? '#fee2e2' : '#d1fae5'}
                                    theme={theme}
                                />
                                {index < recent.length - 1 && <View className={`h-[1px] my-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-100'}`} />}
                            </View>
                        ))
                    )}
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}

function ActivityItem({ title, subtitle, icon, color = "#10b981", bg = "#d1fae5", theme }: any) {
    return (
        <View className="flex-row items-center space-x-4">
            <View className="h-10 w-10 rounded-full items-center justify-center" style={{ backgroundColor: bg }}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View>
                <Text className={`font-medium font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{title}</Text>
                <Text className={`text-xs font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{subtitle}</Text>
            </View>
        </View>
    )
}
