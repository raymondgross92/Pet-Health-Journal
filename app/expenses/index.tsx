import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator, LayoutAnimation, UIManager, Platform } from 'react-native';
import EmptyState from '../../components/ui/EmptyState';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDb } from '../../db';
import { Expense } from '../../types';
import Button from '../../components/ui/Button';

const screenWidth = Dimensions.get('window').width;

export default function ExpensesScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useLanguage(); // We might need to add translations later
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalMonth, setTotalMonth] = useState(0);

    const loadData = async () => {
        try {
            setLoading(true);
            const db = await getDb();
            const result = await db.getAllAsync<Expense>(
                'SELECT * FROM expenses ORDER BY date DESC'
            );
            setExpenses(result);

            // Calculate current month total
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const total = result.reduce((sum, item) => {
                const [d, m, y] = item.date.split('.');
                // Check if valid date format DD.MM.YYYY
                if (parseInt(m) - 1 === currentMonth && parseInt(y) === currentYear) {
                    return sum + item.amount;
                }
                return sum;
            }, 0);
            setTotalMonth(total);

        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte Ausgaben nicht laden.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const chartConfig = {
        backgroundGradientFrom: theme === 'dark' ? "#1e293b" : "#ffffff",
        backgroundGradientTo: theme === 'dark' ? "#1e293b" : "#ffffff",
        color: (opacity = 1) => theme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
    };

    // Prepare Chart Data
    const categoryDataLine = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(categoryDataLine).map((key, index) => {
        const colors = [
            '#f87171', // red
            '#60a5fa', // blue
            '#34d399', // green
            '#fbbf24', // amber
            '#a78bfa', // violet
        ];
        return {
            name: key,
            population: categoryDataLine[key],
            color: colors[index % colors.length],
            legendFontColor: theme === 'dark' ? "#cbd5e1" : "#7f7f7f",
            legendFontSize: 12
        };
    });

    const handleDelete = (id: number) => {
        Alert.alert(
            "Löschen",
            "Eintrag wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDb();
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
                        loadData();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('expenses_title')}</Text>
                <TouchableOpacity onPress={() => router.push('/expenses/add')} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {/* Summary Card */}
                <View className={`p-6 rounded-3xl mb-6 shadow-sm ${theme === 'dark' ? 'bg-indigo-900/20' : 'bg-white'}`}>
                    <Text className={`text-center mb-2 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('expenses_month')}</Text>
                    <Text className={`text-center text-4xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{totalMonth.toFixed(2)} €</Text>
                </View>

                {/* Chart */}
                {chartData.length > 0 && (
                    <View className={`p-4 rounded-3xl mb-6 shadow-sm items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        <Text className={`text-lg font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Verteilung (Gesamt)</Text>
                        <PieChart
                            data={chartData}
                            width={screenWidth - 80}
                            height={220}
                            chartConfig={chartConfig}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    </View>
                )}

                {/* List */}
                <Text className={`text-lg font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('expenses_history')}</Text>
                {expenses.length === 0 ? (
                    <EmptyState
                        icon="wallet-outline"
                        title={t('no_expenses')}
                        actionLabel={t('expenses_add')}
                        onAction={() => router.push('/expenses/add')}
                    />
                ) : (
                    expenses.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onLongPress={() => handleDelete(item.id)}
                            className={`flex-row justify-between items-center p-4 mb-3 rounded-2xl shadow-sm ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                        >
                            <View className="flex-row items-center space-x-3">
                                <View className={`h-10 w-10 rounded-full items-center justify-center ${item.category === 'Food' ? 'bg-green-100' :
                                    item.category === 'Vet' ? 'bg-blue-100' :
                                        item.category === 'Toys' ? 'bg-yellow-100' : 'bg-gray-100'
                                    }`}>
                                    <Ionicons
                                        name={
                                            item.category === 'Food' ? 'nutrition' :
                                                item.category === 'Vet' ? 'medkit' :
                                                    item.category === 'Toys' ? 'tennisball' : 'pricetag'
                                        }
                                        size={20}
                                        color="#334155"
                                    />
                                </View>
                                <View>
                                    <Text className={`font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{item.title}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{item.date} • {item.category}</Text>
                                </View>
                            </View>
                            <Text className={`font-bold text-lg font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{item.amount.toFixed(2)} €</Text>
                        </TouchableOpacity>
                    ))
                )}
                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
