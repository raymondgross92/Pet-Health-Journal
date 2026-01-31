import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDb } from '../../db';
import { Pet } from '../../types';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';

export default function DashboardScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [pets, setPets] = useState<Pet[]>([]);
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [lowStock, setLowStock] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

    const loadData = async () => {
        try {
            const db = await getDb();
            const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets');
            setPets(petsResult);

            if (petsResult.length > 0) {
                const stockResult = await db.getAllAsync<any>('SELECT * FROM medications WHERE stock <= 3');
                setLowStock(stockResult);

                const routines = await db.getAllAsync<any>(`
                    SELECT routine_times.time, routines.title, routines.type, pets.name as pet_name 
                    FROM routine_times 
                    JOIN routines ON routine_times.routine_id = routines.id 
                    LEFT JOIN pets ON routines.pet_id = pets.id
                    WHERE routines.enabled = 1
                    ORDER BY routine_times.time ASC
                `);

                const tasks = routines.map(r => ({
                    id: Math.random(),
                    type: 'routine',
                    title: r.title,
                    time: r.time,
                    subtitle: r.pet_name,
                    icon: r.type === 'food' ? 'restaurant' : r.type === 'walk' ? 'walk' : 'time',
                    color: r.type === 'food' ? '#f97316' : r.type === 'walk' ? '#22c55e' : '#64748b'
                }));
                setTodayTasks(tasks);
            }
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().then(() => setRefreshing(false));
    }, []);

    if (!loading && pets.length === 0) {
        return (
            <SafeAreaView className={`flex-1 items-center justify-center px-6 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
                <View className={`w-32 h-32 rounded-full items-center justify-center mb-8 ${theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                    <Ionicons name="paw" size={64} color="#8b5cf6" />
                </View>
                <Text className={`text-3xl font-bold text-center mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Willkommen!</Text>
                <Text className={`text-center text-lg mb-10 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Dein persönliches Gesundheitsjournal für deine Haustiere. Lege jetzt dein erstes Tier an.
                </Text>
                <Button
                    label="Erstes Haustier hinzufügen"
                    onPress={() => router.push('/add-pet')}
                    size="lg"
                    className="w-full"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                className="flex-1"
            >
                <View className="px-5 py-6 flex-row justify-between items-start">
                    <View>
                        <Text className={`text-3xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{greeting}</Text>
                        <Text className={theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}>Willkommen zurück in deinem Pet Health Journal.</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/search')}
                        className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm'}`}
                    >
                        <Ionicons name="search" size={24} color={theme === 'dark' ? 'white' : '#64748b'} />
                    </TouchableOpacity>
                </View>

                {pets.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-8">
                        {pets.map(pet => (
                            <TouchableOpacity
                                key={pet.id}
                                onPress={() => router.push(`/pet/${pet.id}`)}
                                className="mr-4 items-center"
                            >
                                <Image
                                    source={pet.image_uri ? { uri: pet.image_uri } : { uri: 'https://placehold.co/150' }}
                                    className="w-16 h-16 rounded-full bg-gray-300 mb-2 border-2 border-primary-500"
                                />
                                <Text className={`font-medium text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-700'}`}>{pet.name}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            onPress={() => router.push('/add-pet')}
                            className={`w-16 h-16 rounded-full items-center justify-center border-2 border-dashed mb-2 ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-secondary-300 bg-secondary-100'}`}
                        >
                            <Ionicons name="add" size={24} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                        </TouchableOpacity>
                    </ScrollView>
                )}

                {lowStock.length > 0 && (
                    <View className="px-5 mb-6">
                        {lowStock.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(`/medication/${item.id}`)}
                                className="bg-red-50 border border-red-100 p-3 rounded-xl flex-row items-center mb-2"
                            >
                                <Ionicons name="alert-circle" size={20} color="#ef4444" className="mr-3" />
                                <View>
                                    <Text className="text-red-700 font-bold text-sm">Medikament fast leer!</Text>
                                    <Text className="text-red-500 text-xs">{item.name} noch {item.stock} Stück</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View className={`px-5 py-6 rounded-t-[30px] flex-1 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                    <Text className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Heute anstehend</Text>

                    {todayTasks.length === 0 ? (
                        <EmptyState
                            icon="checkmark-done-outline"
                            title="Alles erledigt"
                            description="Keine offenen Aufgaben für heute geplant."
                        />
                    ) : (
                        <View>
                            {todayTasks.map((task, idx) => (
                                <View key={idx} className={`flex-row items-center mb-4 p-3 rounded-xl border ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-secondary-50 bg-secondary-50'}`}>
                                    <View className="mr-4 w-12 items-center justify-center">
                                        <Text className={`font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{task.time}</Text>
                                    </View>
                                    <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 bg-opacity-20`} style={{ backgroundColor: task.color + '20' }}>
                                        <Ionicons name={task.icon} size={20} color={task.color} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{task.title}</Text>
                                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{task.subtitle}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
