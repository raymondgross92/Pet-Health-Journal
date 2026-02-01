import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

export default function FoodListScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [foods, setFoods] = useState<any[]>([]);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync('SELECT * FROM foods ORDER BY name ASC');
            setFoods(result);
        } catch (e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const FoodItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => { /* Edit? Or Select? For now just list */ }}
            className={`mb-3 p-4 rounded-2xl flex-row items-center justify-between border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100 shadow-sm'}`}
        >
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    {item.brand ? <Text className={`text-xs font-bold uppercase mr-2 ${theme === 'dark' ? 'text-primary-400' : 'text-primary-600'}`}>{item.brand}</Text> : null}
                    <View className={`px-2 py-0.5 rounded-md ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-100'}`}>
                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-600'}`}>{item.type === 'wet' ? 'Nass' : item.type === 'dry' ? 'Trocken' : item.type === 'treat' ? 'Leckerli' : 'Sonstiges'}</Text>
                    </View>
                </View>
                <Text className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{item.name}</Text>
                {item.ingredients ? <Text className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`} numberOfLines={1}>{item.ingredients}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#475569' : '#cbd5e1'} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-secondary-100 bg-white'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Futter-Datenbank</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
                {foods.length === 0 ? (
                    <EmptyState
                        icon="restaurant-outline"
                        title="Kein Futter eingetragen"
                        description="Füge Nassfutter, Trockenfutter oder Leckerlis hinzu."
                        actionLabel="Neues Futter +"
                        onAction={() => router.push('/food/add')}
                    />
                ) : (
                    <View>
                        {foods.map((food, index) => (
                            <FoodItem key={index} item={food} />
                        ))}
                    </View>
                )}
            </ScrollView>

            <View className={`p-5 border-t space-y-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-secondary-100 bg-white'}`}>
                <Button label="Fütterung eintragen" onPress={() => router.push('/food/log')} variant="primary" />
                <Button label="Neues Futter anlegen" onPress={() => router.push('/food/add')} variant="secondary" />
            </View>
        </SafeAreaView>
    );
}
