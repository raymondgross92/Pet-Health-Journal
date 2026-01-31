import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddExpenseScreen() {
    const router = useRouter();
    const { theme } = useTheme();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [category, setCategory] = useState('Tierarzt');
    const [petId, setPetId] = useState<number | null>(null);
    const [pets, setPets] = useState<any[]>([]);

    const categories = ['Tierarzt', 'Futter', 'Medikamente', 'Zubehör', 'Versicherung', 'Sonstiges'];

    useEffect(() => {
        getDb().then(async (db) => {
            const p = await db.getAllAsync('SELECT id, name FROM pets');
            setPets(p);
            if (p.length > 0) setPetId(p[0].id);
        });
    }, []);

    const handleSave = async () => {
        if (!title || !amount) {
            Alert.alert('Fehler', 'Bitte Titel und Betrag eingeben');
            return;
        }

        try {
            const db = await getDb();
            await db.runAsync(
                'INSERT INTO expenses (pet_id, title, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    petId,
                    title,
                    parseFloat(amount.replace(',', '.')),
                    date.toLocaleDateString('de-DE'),
                    category,
                    ''
                ]
            );
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Ausgabe nicht speichern');
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Ausgabe hinzufügen</Text>
            </View>

            <ScrollView className="p-5">
                <Text className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Titel</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-4 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="z.B. Impfung, Trockenfutter"
                    placeholderTextColor="#94a3b8"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Betrag (CHF)</Text>
                <TextInput
                    className={`p-4 rounded-xl mb-4 text-xl font-bold ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'}`}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Kategorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setCategory(cat)}
                            className={`mr-2 px-4 py-2 rounded-full border ${category === cat
                                ? (theme === 'dark' ? 'bg-primary-900 border-primary-700' : 'bg-primary-100 border-primary-200')
                                : (theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-secondary-200')}`}
                        >
                            <Text className={`${category === cat ? (theme === 'dark' ? 'text-primary-300' : 'text-primary-700') : (theme === 'dark' ? 'text-slate-400' : 'text-secondary-600')}`}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Datum</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className={`p-4 rounded-xl mb-4 flex-row items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                >
                    <Ionicons name="calendar-outline" size={20} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    <Text className={`ml-2 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{date.toLocaleDateString('de-DE')}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        onChange={(e, d) => {
                            setShowDatePicker(false);
                            if (d) setDate(d);
                        }}
                    />
                )}

                <Text className={`text-xs font-bold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Haustier</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                    {pets.map(p => (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => setPetId(p.id)}
                            className={`mr-2 px-4 py-2 rounded-full border ${petId === p.id
                                ? (theme === 'dark' ? 'bg-indigo-900 border-indigo-700' : 'bg-indigo-50 border-indigo-200')
                                : (theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-secondary-200')}`}
                        >
                            <Text className={`${petId === p.id ? (theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700') : (theme === 'dark' ? 'text-slate-400' : 'text-secondary-600')}`}>{p.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Button label="Speichern" onPress={handleSave} size="lg" />
            </ScrollView>
        </SafeAreaView>
    );
}
