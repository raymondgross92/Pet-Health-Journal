import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getDb } from '../db';
import { Pet } from '../types';
import Button from '../components/ui/Button';

export default function FoodCalculatorScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useLanguage();

    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [weight, setWeight] = useState('');
    const [activity, setActivity] = useState('1.6'); // Default: Neutered Adult
    const [result, setResult] = useState<{ rer: number, der: number } | null>(null);

    const activityLevels = [
        { label: 'Kastriert (Erwachsen)', factor: 1.6 },
        { label: 'Nicht kastriert (Erwachsen)', factor: 1.8 },
        { label: 'Sehr aktiv / Arbeit', factor: 2.5 },
        { label: 'Gewichtsabnahme', factor: 1.2 },
        { label: 'Welpe / Jungtier', factor: 3.0 },
    ];

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<Pet>('SELECT * FROM pets');
            setPets(result);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectPet = (pet: Pet) => {
        setSelectedPet(pet);
        setWeight(pet.weight?.toString() || '');
        setResult(null);
    };

    const calculate = () => {
        const w = parseFloat(weight.replace(',', '.'));
        if (isNaN(w) || w <= 0) {
            Alert.alert("Fehler", "Bitte ein gültiges Gewicht eingeben.");
            return;
        }

        const factor = parseFloat(activity);

        // RER = 70 * (weight)^0.75
        const rer = 70 * Math.pow(w, 0.75);
        const der = rer * factor;

        setResult({
            rer: Math.round(rer),
            der: Math.round(der)
        });
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('food_calc')}</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-5">
                <Text className={`text-sm font-bold uppercase mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Tier auswählen (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => handleSelectPet(pet)}
                            className={`mr-3 px-4 py-2 rounded-full border ${selectedPet?.id === pet.id
                                ? (theme === 'dark' ? 'bg-indigo-600 border-indigo-500' : 'bg-primary-500 border-primary-500')
                                : (theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-secondary-200')
                                }`}
                        >
                            <Text className={`font-bold ${selectedPet?.id === pet.id ? 'text-white' : (theme === 'dark' ? 'text-slate-300' : 'text-secondary-600')
                                }`}>{pet.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('calc_weight_input')}</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 text-2xl font-bold ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="0.0"
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={(val) => {
                        setWeight(val);
                        setResult(null);
                    }}
                />

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('calc_activity')}</Text>
                <View className="mb-6">
                    {activityLevels.map((lvl) => (
                        <TouchableOpacity
                            key={lvl.factor}
                            onPress={() => {
                                setActivity(lvl.factor.toString());
                                setResult(null);
                            }}
                            className={`p-4 mb-2 rounded-xl border flex-row justify-between items-center ${activity === lvl.factor.toString()
                                ? (theme === 'dark' ? 'bg-indigo-900/30 border-indigo-500' : 'bg-primary-50 border-primary-500')
                                : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100')
                                }`}
                        >
                            <Text className={`font-medium ${activity === lvl.factor.toString()
                                ? (theme === 'dark' ? 'text-white' : 'text-primary-700')
                                : (theme === 'dark' ? 'text-slate-300' : 'text-secondary-600')
                                }`}>{lvl.label}</Text>
                            {activity === lvl.factor.toString() && (
                                <Ionicons name="checkmark-circle" size={20} color={theme === 'dark' ? '#818cf8' : '#6366f1'} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Button label="Berechnen" onPress={calculate} size="lg" />

                {result && (
                    <View className={`mt-8 p-6 rounded-3xl items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                        <Text className={`text-center mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('calc_result')}</Text>
                        <Text className={`text-center text-5xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{result.der} kcal</Text>

                        <View className={`h-[1px] w-full my-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-100'}`} />

                        <View className="flex-row justify-between w-full px-4">
                            <View>
                                <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Grundumsatz (RER)</Text>
                                <Text className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-700'}`}>{result.rer} kcal</Text>
                            </View>
                            <View className="items-end">
                                <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Faktor</Text>
                                <Text className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-700'}`}>{activity}x</Text>
                            </View>
                        </View>

                        <Text className={`mt-6 text-xs text-center italic ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>
                            {t('calc_note')}
                        </Text>
                    </View>
                )}

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
