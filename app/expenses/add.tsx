import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';

export default function AddExpenseScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<string>('Food');
    const [date, setDate] = useState(new Date().toLocaleDateString('de-DE')); // Simple string for now
    const [notes, setNotes] = useState('');

    const categories = ['Food', 'Vet', 'Toys', 'Insurance', 'Other'];

    const handleSave = async () => {
        if (!title || !amount) {
            Alert.alert("Fehler", "Bitte Titel und Betrag angeben.");
            return;
        }

        const numAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numAmount)) {
            Alert.alert("Fehler", "Ungültiger Betrag.");
            return;
        }

        try {
            const db = await getDb();
            await db.runAsync(
                'INSERT INTO expenses (title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?)',
                [title, numAmount, category, date, notes]
            );
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte nicht speichern.");
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="close" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Ausgabe hinzufügen</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-5">
                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Titel</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="z.B. Hundefutter"
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Betrag (€)</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 text-2xl font-bold ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="0.00"
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Kategorie</Text>
                <View className="flex-row flex-wrap mb-6">
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setCategory(cat)}
                            className={`mr-2 mb-2 px-4 py-2 rounded-full border ${category === cat
                                    ? (theme === 'dark' ? 'bg-indigo-600 border-indigo-500' : 'bg-primary-500 border-primary-500')
                                    : (theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-secondary-200')
                                }`}
                        >
                            <Text className={`font-medium ${category === cat
                                    ? 'text-white'
                                    : (theme === 'dark' ? 'text-slate-300' : 'text-secondary-600')
                                }`}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className={`text-sm font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>Datum</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    value={date}
                    onChangeText={setDate}
                    placeholder="TT.MM.JJJJ"
                />

                <Button label="Speichern" onPress={handleSave} size="lg" />
            </ScrollView>
        </SafeAreaView>
    );
}
