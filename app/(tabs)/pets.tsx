import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import PetCard from '../../components/PetCard';
import Button from '../../components/ui/Button';
import { getDb, initDatabase } from '../../db';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import EmptyState from '../../components/ui/EmptyState';

interface Pet {
    id: number;
    name: string;
    breed: string;
    date_of_birth: string;
    weight: number;
    image_uri?: string;
}

export default function PetsScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    // Load data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            async function loadData() {
                try {
                    await initDatabase(); // Ensure DB is ready
                    const db = await getDb();
                    const allRows = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY id DESC');
                    setPets(allRows);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }

            loadData();
        }, [])
    );

    return (
        <SafeAreaView className={`flex-1 px-5 pt-5 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Meine Haustiere</Text>
                <Button
                    label="Tier hinzufügen"
                    size="sm"
                    onPress={() => router.push('/add-pet')}
                />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#059669" />
                </View>
            ) : pets.length === 0 ? (
                <EmptyState
                    icon="paw"
                    title="Noch keine Haustiere"
                    description="Füge dein erstes Haustier hinzu!"
                    actionLabel="Erstes Tier hinzufügen"
                    onAction={() => router.push('/add-pet')}
                />
            ) : (
                <FlatList
                    data={pets}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <PetCard
                            name={item.name}
                            breed={item.breed}
                            age={item.date_of_birth}
                            image={item.image_uri}
                            onPress={() => router.push(`/pet/${item.id}`)}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </SafeAreaView>
    );
}
