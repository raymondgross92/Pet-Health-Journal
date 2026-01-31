import { View, Text, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import EmptyState from '../../components/ui/EmptyState';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ExpensesScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [chartData, setChartData] = useState<any>(null);
    const [pieData, setPieData] = useState<any>(null);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<any>('SELECT * FROM expenses ORDER BY date DESC');
            setExpenses(result);

            // Calculate Total
            const sum = result.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            setTotal(sum);

            // Calculate Chart Data (Last 6 Months)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            const today = new Date();
            const last6Months = [];
            const dataConfig = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                last6Months.push(months[d.getMonth()]);

                // Filter expenses for this month/year
                // Note: stored date is DD.MM.YYYY
                const monthSum = result.filter(e => {
                    const [day, month, year] = e.date.split('.');
                    return parseInt(month) === d.getMonth() + 1 && parseInt(year) === d.getFullYear();
                }).reduce((acc, curr) => acc + curr.amount, 0);

                dataConfig.push(monthSum);
            }

            setChartData({
                labels: last6Months,
                datasets: [{ data: dataConfig }]
            });

            // Calculate Category Distribution (Pie Chart)
            const categories = {};
            result.forEach(item => {
                const cat = item.category || 'Andere';
                categories[cat] = (categories[cat] || 0) + item.amount;
            });

            const pData = Object.keys(categories).map(cat => {
                let color = '#94a3b8'; // default slate-400
                if (cat === 'Tierarzt') color = '#ef4444'; // red
                if (cat === 'Futter') color = '#f97316'; // orange
                if (cat === 'Medikamente') color = '#22c55e'; // green
                if (cat === 'Zubehör') color = '#3b82f6'; // blue
                if (cat === 'Versicherung') color = '#8b5cf6'; // violet

                return {
                    name: cat,
                    amount: categories[cat],
                    color: color,
                    legendFontColor: theme === 'dark' ? '#cbd5e1' : '#475569',
                    legendFontSize: 12
                };
            });

            // Sort by amount desc
            pData.sort((a, b) => b.amount - a.amount);
            setPieData(pData);

        } catch (e) {
            console.error(e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

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
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Ausgaben</Text>
                <TouchableOpacity
                    onPress={() => router.push('/expenses/add')}
                    className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                >
                    <Ionicons name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {/* Total and Chart */}
                <View className="mb-6">
                    <Text className={`text-sm uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Gesamt (Alle Zeit)</Text>
                    <Text className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{total.toFixed(2)} CHF</Text>

                    {chartData && (
                        <View className={`p-4 rounded-3xl mb-6 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                            <Text className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Verlauf (6 Monate)</Text>
                            <BarChart
                                data={chartData}
                                width={screenWidth - 80}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    backgroundGradientFrom: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    backgroundGradientTo: theme === 'dark' ? '#0f172a' : '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                                    labelColor: (opacity = 1) => theme === 'dark' ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                                    barPercentage: 0.7,
                                }}
                                style={{
                                    borderRadius: 16
                                }}
                                fromZero
                            />
                        </View>
                    )}

                    {pieData && (
                        <View className={`p-4 rounded-3xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                            <Text className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Kategorien</Text>
                            <PieChart
                                data={pieData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                }}
                                accessor={"amount"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                center={[10, 0]}
                                absolute
                                hasLegend={true}
                            />
                        </View>
                    )}
                </View>

                <Text className={`text-sm uppercase font-bold mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Letzte Einträge</Text>
                {expenses.length === 0 ? (
                    <EmptyState
                        icon="wallet-outline"
                        title="Keine Ausgaben"
                        description="Erfasse Tierarztkosten, Futter und mehr."
                        actionLabel="Ausgabe hinzufügen"
                        onAction={() => router.push('/expenses/add')}
                    />
                ) : (
                    <View className="pb-10">
                        {expenses.map(ex => (
                            <TouchableOpacity
                                key={ex.id}
                                onLongPress={() => handleDelete(ex.id)}
                                className={`p-4 mb-3 rounded-2xl flex-row justify-between items-center border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                            >
                                <View className="flex-row items-center">
                                    <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${ex.category === 'Tierarzt' ? 'bg-red-100' :
                                        ex.category === 'Futter' ? 'bg-orange-100' :
                                            'bg-purple-100'
                                        }`}>
                                        <Ionicons name={
                                            ex.category === 'Tierarzt' ? 'medkit' :
                                                ex.category === 'Futter' ? 'nutrition' :
                                                    'pricetag'
                                        } size={20} color={
                                            ex.category === 'Tierarzt' ? '#ef4444' :
                                                ex.category === 'Futter' ? '#f97316' :
                                                    '#8b5cf6'
                                        } />
                                    </View>
                                    <View>
                                        <Text className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{ex.title}</Text>
                                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{ex.date} • {ex.category}</Text>
                                    </View>
                                </View>
                                <Text className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{ex.amount.toFixed(2)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
