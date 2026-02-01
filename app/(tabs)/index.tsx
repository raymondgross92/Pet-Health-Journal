import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, StatusBar, Alert } from 'react-native';
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
import Card from '../../components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';

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
                    SELECT routine_times.time, routines.title, routines.type, routines.medication_id, routines.pet_id, pets.name as pet_name 
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
                    icon: r.type === 'food' ? 'restaurant' : r.type === 'walk' ? 'walk' : r.type === 'medication' ? 'medkit' : 'time',
                    color: r.type === 'food' ? '#f97316' : r.type === 'walk' ? '#22c55e' : r.type === 'medication' ? '#ef4444' : '#64748b',
                    medication_id: r.medication_id,
                    pet_id: r.pet_id
                }));
                setTodayTasks(tasks);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const completeTask = async (task: any) => {
        Alert.alert(
            "Erledigen",
            `Möchtest du "${task.title}" als erledigt markieren?`,
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Erledigt ✅",
                    onPress: async () => {
                        try {
                            const db = await getDb();

                            // 1. Log entry
                            await db.runAsync(
                                'INSERT INTO logs (pet_id, title, description, date, type) VALUES (?, ?, ?, ?, ?)',
                                [task.pet_id || null, task.title, 'Routine erledigt', new Date().toLocaleDateString('de-DE'), 'Routine']
                            );

                            // 2. Decrement Stock if Med
                            if (task.medication_id) {
                                // Get current stock
                                const med = await db.getFirstAsync<any>('SELECT * FROM medications WHERE id = ?', task.medication_id);
                                if (med) {
                                    const newStock = med.stock - 1;
                                    await db.runAsync('UPDATE medications SET stock = ? WHERE id = ?', [newStock, task.medication_id]);

                                    // Alert if low
                                    if (newStock <= (med.min_stock || 3)) {
                                        Alert.alert("Achtung", `Vorrat für ${med.name} ist niedrig (${newStock} übrig)!`);
                                    }
                                }
                            }

                            // 3. Update UI (Remove from list)
                            setTodayTasks(current => current.filter(t => t.id !== task.id));

                        } catch (e) {
                            console.error(e);
                            Alert.alert("Fehler", "Konnte nicht gespeichert werden.");
                        }
                    }
                }
            ]
        );
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

    // Empty State (Welcome)
    if (!loading && pets.length === 0) {
        return (
            <SafeAreaView className={`flex-1 items-center justify-center px-6 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
                <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
                <View className={`w-40 h-40 rounded-full items-center justify-center mb-8 bg-white shadow-2xl shadow-indigo-500/20`}>
                    <LinearGradient
                        colors={['#4ade80', '#16a34a']}
                        className="w-36 h-36 rounded-full items-center justify-center"
                    >
                        <Ionicons name="paw" size={70} color="white" />
                    </LinearGradient>
                </View>
                <Text className={`text-4xl font-extrabold text-center mb-3 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Willkommen!</Text>
                <Text className={`text-center text-lg mb-12 leading-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Dein persönliches Gesundheitsjournal für deine Haustiere. {'\n'}Lege jetzt dein erstes Tier an.
                </Text>
                <Button
                    label="Erstes Haustier hinzufügen"
                    onPress={() => router.push('/add-pet')}
                    size="lg"
                    className="w-full shadow-xl shadow-indigo-500/40"
                    variant="primary"
                />
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1">
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Background Gradient */}
            <LinearGradient
                colors={theme === 'dark' ? ['#0c0a09', '#1c1917'] : ['#ecfccb', '#f5f5f4']}
                className="absolute left-0 right-0 top-0 h-full"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView className="flex-1">
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme === 'dark' ? '#fff' : '#8b5cf6'} />}
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Header */}
                    <View className="px-6 pt-4 pb-2 flex-row justify-between items-start">
                        <View>
                            <Text className={`text-sm font-bold uppercase mb-1 tracking-wider ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`}>
                                {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </Text>
                            <Text className={`text-4xl font-extrabold font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{greeting}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/search')}
                            className={`p-3 rounded-full ${theme === 'dark' ? 'bg-stone-800' : 'bg-white shadow-lg shadow-green-900/10'}`}
                        >
                            <Ionicons name="search" size={24} color={theme === 'dark' ? 'white' : '#64748b'} />
                        </TouchableOpacity>
                    </View>

                    {/* Pets Quick Access */}
                    {pets.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-4 mb-2">
                            {pets.map(pet => (
                                <TouchableOpacity
                                    key={pet.id}
                                    onPress={() => router.push(`/pet/${pet.id}`)}
                                    className="mr-5 items-center"
                                >
                                    <View className={`w-20 h-20 rounded-full p-1 border-2 ${theme === 'dark' ? 'border-primary-500' : 'border-primary-400'}`}>
                                        <Image
                                            source={pet.image_uri ? { uri: pet.image_uri } : { uri: 'https://placehold.co/150' }}
                                            className="w-full h-full rounded-full bg-slate-200"
                                        />
                                    </View>
                                    <Text className={`mt-2 font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{pet.name}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => router.push('/add-pet')}
                                className="mr-5 items-center justify-center"
                            >
                                <View className={`w-20 h-20 rounded-full items-center justify-center border-2 border-dashed ${theme === 'dark' ? 'border-stone-700 bg-stone-800' : 'border-green-300 bg-white'}`}>
                                    <Ionicons name="add" size={32} color={theme === 'dark' ? '#a8a29e' : '#16a34a'} />
                                </View>
                                <Text className={`mt-2 font-medium text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Neu</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}

                    {/* Alerts (Low Stock) */}
                    {lowStock.length > 0 && (
                        <View className="px-6 mb-6">
                            {lowStock.map(item => (
                                <Card key={item.id} className="mb-3 bg-red-50 border-red-100 flex-row items-center border shadow-none" padding="sm" onPress={() => router.push(`/medication/${item.id}`)}>
                                    <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                                        <Ionicons name="alert" size={20} color="#ef4444" />
                                    </View>
                                    <View>
                                        <Text className="text-red-800 font-bold text-base">Medikament nachfüllen!</Text>
                                        <Text className="text-red-600 font-medium text-sm">{item.name}: Nur noch {item.stock} Stück</Text>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Today's Tasks */}
                    <View className="px-6 flex-1">
                        <Text className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Heute anstehend</Text>

                        {todayTasks.length === 0 ? (
                            <Card className="items-center py-10" variant="elevated">
                                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="checkmark" size={32} color="#10b981" />
                                </View>
                                <Text className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Alles erledigt!</Text>
                                <Text className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Keine offenen Aufgaben für heute.</Text>
                            </Card>
                        ) : (
                            <View>
                                {todayTasks.map((task, idx) => (
                                    <TouchableOpacity key={idx} onPress={() => completeTask(task)}>
                                        <Card className="mb-4 flex-row items-center shadow-sm" padding="md" variant="elevated">
                                            <View className="mr-5 items-center justify-center w-14">
                                                <Text className={`font-bold text-lg ${theme === 'dark' ? 'text-primary-300' : 'text-primary-600'}`}>{task.time}</Text>
                                            </View>

                                            <View className="h-12 w-1 border-r border-slate-100 mr-5" />

                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <View className={`h-6 w-6 rounded-full items-center justify-center mr-2`} style={{ backgroundColor: task.color + '20' }}>
                                                        <Ionicons name={task.icon} size={14} color={task.color} />
                                                    </View>
                                                    <Text className={`font-bold text-xs uppercase tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{task.type}</Text>
                                                </View>
                                                <Text className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{task.title}</Text>
                                                <Text className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{task.subtitle}</Text>
                                            </View>

                                            <Ionicons name="radio-button-off" size={24} color={theme === 'dark' ? '#475569' : '#cbd5e1'} />
                                        </Card>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
