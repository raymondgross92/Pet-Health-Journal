import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface Vet {
    id: number;
    name: string;
    phone: string;
    address: string;
    emergency: number; // 0 or 1
    notes: string;
}

interface Medication {
    id: number;
    pet_id: number;
    name: string;
    dosage: string;
    frequency: string;
    stock: number;
    notes: string;
    pet_name?: string; // from join
    min_stock?: number;
}

interface Routine {
    id: number;
    pet_id: number;
    title: string;
    type: string;
    time: string;
    enabled: number;
    pet_name?: string;
}

export default function CareScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [vets, setVets] = useState<Vet[]>([]);
    const [meds, setMeds] = useState<Medication[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const db = await getDb();
            // Load Vets
            const vetsResult = await db.getAllAsync<Vet>('SELECT * FROM vets ORDER BY emergency DESC, name ASC');
            setVets(vetsResult);

            // Load Routines
            // Load Routines
            const routinesResult = await db.getAllAsync<Routine>(`
                SELECT routine_times.id, routines.title, routines.type, routine_times.time, pets.name as pet_name
                FROM routine_times
                JOIN routines ON routine_times.routine_id = routines.id
                LEFT JOIN pets ON routines.pet_id = pets.id
                ORDER BY routine_times.time ASC
            `);
            setRoutines(routinesResult);

            // Load Meds
            const medsResult = await db.getAllAsync<Medication>(`
                SELECT medications.*, pets.name as pet_name 
                FROM medications 
                LEFT JOIN pets ON medications.pet_id = pets.id 
                ORDER BY medications.stock ASC
            `);
            setMeds(medsResult);

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

    const handleCall = (phone: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const decrementStock = async (id: number, currentStock: number) => {
        if (currentStock <= 0) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            const db = await getDb();
            await db.runAsync('UPDATE medications SET stock = stock - 1 WHERE id = ?', [id]);
            loadData(); // Reload to update UI
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center shadow-sm ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-secondary-100'}`}>
                <Text className={`text-2xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('care_title')}</Text>
                <View className="flex-row space-x-3">
                    <TouchableOpacity
                        onPress={() => router.push('/add-medication')}
                        className="h-10 w-10 bg-blue-100 rounded-full items-center justify-center active:bg-blue-200"
                    >
                        <Ionicons name="medkit" size={20} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/food-calculator')}
                        className="h-10 w-10 bg-orange-100 rounded-full items-center justify-center active:bg-orange-200"
                    >
                        <Ionicons name="nutrition" size={20} color="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/add-vet')}
                        className="h-10 w-10 bg-primary-100 rounded-full items-center justify-center active:bg-primary-200"
                    >
                        <Ionicons name="add" size={24} color="#6d28d9" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-5 pt-5">


                {/* Routines Section */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-secondary-500 font-bold uppercase text-xs font-sans">{t('routines_title')}</Text>
                        {routines.length > 0 && (
                            <TouchableOpacity onPress={() => router.push('/add-routine')}>
                                <Text className="text-primary-600 text-xs font-bold">{t('edit_pet')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {routines.length === 0 ? (
                        <EmptyState
                            icon="calendar-outline"
                            title={t('no_routines')}
                            actionLabel={t('routines_add')}
                            onAction={() => router.push('/add-routine')}
                        />
                    ) : (
                        routines.map(routine => (
                            <TouchableOpacity
                                key={routine.id}
                                onPress={() => router.push(`/routine/${routine.id}`)}
                                className="bg-white mb-3 rounded-2xl p-4 shadow-sm border border-secondary-100 flex-row items-center active:bg-secondary-50 dark:bg-slate-900 dark:border-slate-800"
                            >
                                <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${routine.type === 'food' ? 'bg-orange-100 dark:bg-orange-900/50' :
                                    routine.type === 'walk' ? 'bg-green-100 dark:bg-green-900/50' :
                                        routine.type === 'hygiene' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-slate-800'
                                    }`}>
                                    <Ionicons
                                        name={
                                            routine.type === 'food' ? 'restaurant' :
                                                routine.type === 'walk' ? 'walk' :
                                                    routine.type === 'hygiene' ? 'water' : 'time'
                                        }
                                        size={20}
                                        color={
                                            routine.type === 'food' ? '#f97316' :
                                                routine.type === 'walk' ? '#22c55e' :
                                                    routine.type === 'hygiene' ? '#3b82f6' : '#64748b'
                                        }
                                    />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Text className="text-lg font-bold text-secondary-900 font-sans mr-2 dark:text-white">{routine.time}</Text>
                                        <View className="bg-secondary-100 px-2 py-0.5 rounded-md dark:bg-slate-800">
                                            <Text className="text-secondary-600 text-xs font-bold dark:text-slate-400">{routine.pet_name}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-secondary-500 text-sm font-sans dark:text-slate-400">{routine.title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                            </TouchableOpacity>
                        ))
                    )}

                    {routines.length > 0 && (
                        <Button
                            label={t('routines_add')}
                            variant="secondary"
                            className="mt-2"
                            onPress={() => router.push('/add-routine')}
                        />
                    )}
                </View>

                {/* Medications Section */}
                <View className="mb-8">
                    <Text className="text-secondary-500 font-bold mb-3 uppercase text-xs font-sans">{t('medications_title')}</Text>

                    {meds.length === 0 ? (
                        <EmptyState
                            icon="flask-outline"
                            title={t('no_medications')}
                            actionLabel={t('medications_add')}
                            onAction={() => router.push('/add-medication')}
                        />
                    ) : (
                        meds.map(med => (
                            <TouchableOpacity
                                key={med.id}
                                onPress={() => router.push(`/medication/${med.id}`)}
                                className="bg-white mb-3 rounded-2xl p-4 shadow-sm border border-secondary-100 flex-row justify-between items-center active:bg-secondary-50 dark:bg-slate-900 dark:border-slate-800"
                            >
                                <View className="flex-1 mr-3">
                                    <View className="flex-row items-center mb-1">
                                        <View className="bg-primary-100 px-2 py-0.5 rounded-md mr-2 dark:bg-primary-900/50">
                                            <Text className="text-primary-700 text-xs font-bold dark:text-primary-300">{med.pet_name || '?'}</Text>
                                        </View>
                                        <Text className="text-lg font-bold text-secondary-900 font-sans dark:text-white">{med.name}</Text>
                                    </View>
                                    <Text className="text-secondary-500 text-sm font-sans dark:text-slate-400">{med.dosage} • {med.frequency}</Text>
                                    {med.stock <= (med.min_stock || 3) && (
                                        <Text className="text-red-500 text-xs font-bold mt-1">
                                            {med.stock === 0 ? 'Leer!' : `Nur noch ${med.stock} Stk.`}
                                        </Text>
                                    )}
                                </View>

                                <View className="items-center">
                                    <View className="bg-secondary-100 h-8 px-3 rounded-full justify-center items-center mb-1 dark:bg-slate-800">
                                        <Text className="font-bold text-secondary-600 dark:text-slate-400">{med.stock}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation(); // Don't trigger edit
                                            decrementStock(med.id, med.stock);
                                        }}
                                        className="bg-primary-500 h-8 w-8 rounded-full items-center justify-center shadow-sm active:bg-primary-600"
                                    >
                                        <Ionicons name="remove" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Emergency Section */}
                <View className="mb-6">
                    <Text className="text-secondary-500 font-bold mb-3 uppercase text-xs font-sans">{t('vets_title')}</Text>

                    {vets.length === 0 ? (
                        <EmptyState
                            icon="medkit-outline"
                            title={t('no_vets')}
                            actionLabel={t('vets_add')}
                            onAction={() => router.push('/add-vet')}
                        />
                    ) : (
                        vets.map(vet => (
                            <TouchableOpacity
                                key={vet.id}
                                onPress={() => router.push(`/vet/${vet.id}`)}
                                className={`mb-4 rounded-2xl p-5 shadow-sm border ${vet.emergency ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-white border-secondary-100 dark:bg-slate-900 dark:border-slate-800'}`}
                            >
                                <View className="flex-row justify-between items-start">
                                    <View className="flex-1 mr-4">
                                        <View className="flex-row items-center space-x-2 mb-1">
                                            {vet.emergency === 1 && <Ionicons name="warning" size={16} color="#ef4444" />}
                                            <Text className={`text-lg font-bold font-sans ${vet.emergency ? 'text-red-700 dark:text-red-400' : 'text-secondary-900 dark:text-white'}`}>{vet.name}</Text>
                                        </View>
                                        {vet.address ? (
                                            <Text className="text-secondary-500 text-sm font-sans mb-1 dark:text-slate-400">{vet.address}</Text>
                                        ) : null}
                                        {vet.notes ? (
                                            <Text className="text-secondary-400 text-xs italic font-sans dark:text-slate-500">"{vet.notes}"</Text>
                                        ) : null}
                                    </View>

                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleCall(vet.phone);
                                        }}
                                        className={`h-12 w-12 rounded-full items-center justify-center ${vet.emergency ? 'bg-red-500 shadow-red-200' : 'bg-primary-500 shadow-primary-200'} shadow-lg`}
                                    >
                                        <Ionicons name="call" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
