import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AddFoodScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [type, setType] = useState('dry'); // dry, wet, treat, supplement
    const [calories, setCalories] = useState('');
    const [ingredients, setIngredients] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Namen an.');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            await db.runAsync(
                'INSERT INTO foods (name, brand, type, calories_per_100g, ingredients) VALUES (?, ?, ?, ?, ?)',
                name, brand, type, calories ? parseFloat(calories) : null, ingredients
            );
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Futter nicht speichern.');
        } finally {
            setLoading(false);
        }
    };

    const TypeOption = ({ id, label, icon }: any) => (
        <TouchableOpacity
            onPress={() => setType(id)}
            className={`flex-1 p-3 rounded-xl border items-center mr-2 ${type === id ? 'bg-primary-50 border-primary-500' : (theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-secondary-200')}`}
        >
            <Ionicons name={icon} size={20} color={type === id ? '#059669' : (theme === 'dark' ? '#94a3b8' : '#94a3b8')} />
            <Text className={`mt-1 font-bold ${type === id ? 'text-primary-700' : (theme === 'dark' ? 'text-slate-400' : 'text-secondary-500')}`}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-secondary-100 bg-white'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Neues Futter</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <Text className={`font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-900'}`}>Art des Futters</Text>
                <View className="flex-row mb-6">
                    <TypeOption id="dry" label="Trocken" icon="cube" />
                    <TypeOption id="wet" label="Nass" icon="water" />
                    <TypeOption id="treat" label="Snack" icon="star" />
                </View>

                <View className={`p-4 rounded-2xl border mb-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}>
                    <Input label="Name / Sorte" value={name} onChangeText={setName} placeholder="z.B. Huhn mit Reis" />
                    <Input label="Marke" value={brand} onChangeText={setBrand} placeholder="z.B. Happy Dog" />
                    <Input label="Kalorien (kcal/100g)" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="Optional" />
                    <Input label="Zutaten / Notizen" value={ingredients} onChangeText={setIngredients} multiline numberOfLines={3} placeholder="Wichtig für Allergien..." />
                </View>

                <Button label={loading ? "Speichert..." : "Speichern"} onPress={handleSave} disabled={loading} />
            </ScrollView>
        </SafeAreaView>
    );
}
