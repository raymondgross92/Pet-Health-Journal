import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DateTimePickerInput from '../../components/ui/DateTimePickerInput';

export default function LogFoodScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);

    const [pets, setPets] = useState<any[]>([]);
    const [foods, setFoods] = useState<any[]>([]);

    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
    const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const db = await getDb();
            const petsResult = await db.getAllAsync<any>('SELECT * FROM pets ORDER BY name ASC');
            setPets(petsResult);
            if (petsResult.length > 0) setSelectedPetId(petsResult[0].id);

            const foodsResult = await db.getAllAsync<any>('SELECT * FROM foods ORDER BY name ASC');
            setFoods(foodsResult);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!selectedPetId || !selectedFoodId) {
            Alert.alert('Fehler', 'Bitte Tier und Futter wählen.');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toISOString().split('T')[0];

            await db.runAsync(
                'INSERT INTO food_logs (pet_id, food_id, amount_grams, date, time) VALUES (?, ?, ?, ?, ?)',
                selectedPetId, selectedFoodId, amount ? parseFloat(amount) : null, dateStr, timeStr
            );

            Alert.alert("Erfolg", "Mahlzeit eingetragen!", [{ text: "OK", onPress: () => router.back() }]);
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte nicht speichern.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-secondary-100 bg-white'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Fütterung eintragen</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Pet Selection */}
                <Text className={`font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-900'}`}>Wer hat gefressen?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            className={`mr-3 px-4 py-2 rounded-full border ${selectedPetId === pet.id ? 'bg-primary-500 border-primary-500' : (theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-secondary-200')}`}
                        >
                            <Text className={`font-bold ${selectedPetId === pet.id ? 'text-white' : (theme === 'dark' ? 'text-slate-400' : 'text-secondary-600')}`}>
                                {pet.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Food Selection */}
                <Text className={`font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-900'}`}>Was gab es?</Text>
                <ScrollView className="mb-6 max-h-40 bg-white dark:bg-slate-900 rounded-xl border border-secondary-100 dark:border-slate-800">
                    {foods.map(food => (
                        <TouchableOpacity
                            key={food.id}
                            onPress={() => setSelectedFoodId(food.id)}
                            className={`p-3 border-b border-secondary-50 dark:border-slate-800 flex-row items-center justify-between ${selectedFoodId === food.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                        >
                            <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{food.name}</Text>
                            {selectedFoodId === food.id && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
                        </TouchableOpacity>
                    ))}
                    {foods.length === 0 && (
                        <TouchableOpacity onPress={() => router.push('/food/add')} className="p-4 items-center">
                            <Text className="text-primary-600 font-bold">Neues Futter anlegen +</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>

                {/* Details */}
                <View className={`p-4 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}>
                    <Input
                        label="Menge (Gramm/Stück)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="z.B. 150"
                    />
                    <Text className={`text-sm font-bold mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-900'}`}>Zeitpunkt</Text>
                    <DateTimePickerInput
                        value={date}
                        mode="datetime"
                        onChange={setDate}
                    />
                </View>

                <Button label={loading ? "Speichert..." : "Eintragen"} onPress={handleSave} disabled={loading} />
            </ScrollView>
        </SafeAreaView>
    );
}
