import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { getDb } from '../db';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Pet, Log } from '../types';

type SearchResult = {
    type: 'pet' | 'log' | 'medication' | 'vet';
    id: number;
    title: string;
    description: string;
    date?: string;
    subTitle?: string;
};

export default function SearchScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const performSearch = useCallback(async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            const searchTerm = `%${text}%`;
            const searchResults: SearchResult[] = [];

            // 1. Search Pets
            const pets = await db.getAllAsync<Pet>(
                `SELECT * FROM pets WHERE name LIKE ? OR breed LIKE ?`,
                searchTerm, searchTerm
            );
            pets.forEach(p => searchResults.push({
                type: 'pet',
                id: p.id,
                title: p.name,
                description: `${p.species} - ${p.breed || ''}`,
                subTitle: 'Haustier'
            }));

            // 2. Search Logs
            const logs = await db.getAllAsync<Log>(
                `SELECT l.*, p.name as pet_name FROM logs l LEFT JOIN pets p ON l.pet_id = p.id WHERE l.title LIKE ? OR l.description LIKE ?`,
                searchTerm, searchTerm
            );
            logs.forEach((l: any) => searchResults.push({
                type: 'log',
                id: l.id,
                title: l.title,
                description: l.description,
                date: l.date,
                subTitle: `${l.type} (${l.pet_name})`
            }));

            // 3. Search Medications
            const meds = await db.getAllAsync<any>(
                `SELECT m.*, p.name as pet_name FROM medications m LEFT JOIN pets p ON m.pet_id = p.id WHERE m.name LIKE ?`,
                searchTerm
            );
            meds.forEach((m: any) => searchResults.push({
                type: 'medication',
                id: m.id,
                title: m.name,
                description: `${m.dosage} - ${m.stock} übrig`,
                subTitle: `Medikament (${m.pet_name})`
            }));

            // 4. Search Vets
            const vets = await db.getAllAsync<any>(
                `SELECT * FROM vets WHERE name LIKE ?`,
                searchTerm
            );
            vets.forEach((v: any) => searchResults.push({
                type: 'vet',
                id: v.id,
                title: v.name,
                description: v.phone || v.address || '',
                subTitle: 'Tierarzt'
            }));

            setResults(searchResults);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePress = (item: SearchResult) => {
        if (item.type === 'pet') {
            router.push({ pathname: '/pet/[id]', params: { id: item.id } });
        } else if (item.type === 'log') {
            router.push({ pathname: '/pet/log/[id]', params: { id: item.id } });
        }
        // Medication/Vet details not yet implemented, maybe navigate to list?
        // keeping it simple for now
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center space-x-3 ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>

                <View className={`flex-1 flex-row items-center px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                    <Ionicons name="search" size={20} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    <TextInput
                        className={`flex-1 ml-2 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                        value={query}
                        onChangeText={performSearch}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => performSearch('')}>
                            <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#64748b' : '#94a3b8'} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View className="mt-10">
                    <ActivityIndicator size="small" color="#059669" />
                </View>
            ) : (
                <ScrollView className="flex-1 px-5 pt-4" keyboardShouldPersistTaps="handled">
                    {results.length === 0 && query.length >= 2 && (
                        <Text className={`text-center mt-10 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{t('search_no_results')}</Text>
                    )}

                    {results.map((item, index) => (
                        <TouchableOpacity
                            key={`${item.type}-${item.id}`}
                            onPress={() => handlePress(item)}
                            className={`flex-row items-center p-4 mb-3 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                        >
                            <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${item.type === 'pet' ? (theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100') :
                                    item.type === 'log' ? (theme === 'dark' ? 'bg-green-900' : 'bg-green-100') :
                                        item.type === 'medication' ? (theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100') :
                                            (theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100')
                                }`}>
                                <Ionicons
                                    name={
                                        item.type === 'pet' ? 'paw' :
                                            item.type === 'log' ? 'document-text' :
                                                item.type === 'medication' ? 'medkit' :
                                                    'people'
                                    }
                                    size={20}
                                    color={
                                        item.type === 'pet' ? '#6366f1' :
                                            item.type === 'log' ? '#10b981' :
                                                item.type === 'medication' ? '#3b82f6' :
                                                    '#f97316'
                                    }
                                />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between">
                                    <Text className={`text-xs font-bold uppercase mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{item.subTitle}</Text>
                                    {item.date && (
                                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-600' : 'text-secondary-400'}`}>{item.date}</Text>
                                    )}
                                </View>
                                <Text className={`font-bold text-base font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{item.title}</Text>
                                {item.description ? (
                                    <Text numberOfLines={1} className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{item.description}</Text>
                                ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#475569' : '#cbd5e1'} />
                        </TouchableOpacity>
                    ))}
                    <View className="h-10" />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
