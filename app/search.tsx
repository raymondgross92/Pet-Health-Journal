import { View, Text, TextInput, TouchableOpacity, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getDb } from '../db';

export default function SearchScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (text: string) => {
        setLoading(true);
        try {
            const db = await getDb();
            const searchTerm = `%${text}%`;

            // Parallel Queries
            const [pets, logs, meds, expenses, vets] = await Promise.all([
                db.getAllAsync<any>('SELECT id, name, breed FROM pets WHERE name LIKE ? OR breed LIKE ?', [searchTerm, searchTerm]),
                db.getAllAsync<any>('SELECT id, title, description, date, type FROM logs WHERE title LIKE ? OR description LIKE ?', [searchTerm, searchTerm]),
                db.getAllAsync<any>('SELECT id, name, notes FROM medications WHERE name LIKE ? OR notes LIKE ?', [searchTerm, searchTerm]),
                db.getAllAsync<any>('SELECT id, title, category, amount, date FROM expenses WHERE title LIKE ? OR category LIKE ?', [searchTerm, searchTerm]),
                db.getAllAsync<any>('SELECT id, name, address FROM vets WHERE name LIKE ? OR address LIKE ?', [searchTerm, searchTerm])
            ]);

            const sections = [];

            if (pets.length > 0) sections.push({ title: 'Haustiere', data: pets.map(p => ({ ...p, type: 'pet' })) });
            if (logs.length > 0) sections.push({ title: 'Tagebuch', data: logs.map(l => ({ ...l, type: 'log' })) });
            if (meds.length > 0) sections.push({ title: 'Medikamente', data: meds.map(m => ({ ...m, type: 'med' })) });
            if (expenses.length > 0) sections.push({ title: 'Ausgaben', data: expenses.map(e => ({ ...e, type: 'expense' })) });
            if (vets.length > 0) sections.push({ title: 'Tierärzte', data: vets.map(v => ({ ...v, type: 'vet' })) });

            setResults(sections);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (item: any) => {
        switch (item.type) {
            case 'pet': router.push(`/pet/${item.id}`); break;
            case 'log': router.push(`/pet/log/${item.id}`); break;
            case 'med': router.push(`/medication/${item.id}`); break;
            case 'expense': router.push(`/expenses`); break; // Expenses list doesn't have detail yet, just go to list
            case 'vet': router.push(`/vet/${item.id}`); break;
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center space-x-3 ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <View className={`flex-1 flex-row items-center px-4 h-12 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="search" size={20} color="#94a3b8" />
                    <TextInput
                        className={`flex-1 ml-3 font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}
                        placeholder="Suchen..."
                        placeholderTextColor="#94a3b8"
                        autoFocus
                        value={query}
                        onChangeText={setQuery}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : (
                <SectionList
                    sections={results}
                    keyExtractor={(item, index) => item.id.toString() + index}
                    contentContainerStyle={{ padding: 20 }}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text className={`text-xs font-bold uppercase mb-2 mt-4 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{title}</Text>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handlePress(item)}
                            className={`p-4 mb-3 rounded-xl border flex-row items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                        >
                            <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${item.type === 'pet' ? 'bg-indigo-100' :
                                    item.type === 'log' ? 'bg-blue-100' :
                                        item.type === 'med' ? 'bg-red-100' :
                                            item.type === 'vet' ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                <Ionicons name={
                                    item.type === 'pet' ? 'paw' :
                                        item.type === 'log' ? 'book' :
                                            item.type === 'med' ? 'medkit' :
                                                item.type === 'vet' ? 'people' : 'wallet'
                                } size={20} color={
                                    item.type === 'pet' ? '#6366f1' :
                                        item.type === 'log' ? '#3b82f6' :
                                            item.type === 'med' ? '#ef4444' :
                                                item.type === 'vet' ? '#22c55e' : '#f97316'
                                } />
                            </View>
                            <View>
                                <Text className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{item.name || item.title}</Text>
                                <Text numberOfLines={1} className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>
                                    {item.description || item.breed || item.notes || item.date}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        query.length > 2 ? (
                            <Text className={`text-center mt-10 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Keine Ergebnisse gefunden.</Text>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}
