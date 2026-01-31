import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { getDb } from '../../../db';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function SymptomListScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [symptoms, setSymptoms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<{ labels: string[], data: number[], title: string } | null>(null);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<any>(
                'SELECT * FROM symptoms WHERE pet_id = ? ORDER BY date DESC, time DESC',
                Number(id)
            );
            setSymptoms(result);

            // Analyze for chart: Find the most frequent symptom title and plot its severity
            if (result.length >= 2) {
                // Count frequencies
                const counts: any = {};
                result.forEach(r => {
                    counts[r.title] = (counts[r.title] || 0) + 1;
                });
                // Get top symptom
                const topSymptom = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

                // Get data for this symptom, sorted by date ASC
                const chartPoints = result
                    .filter(r => r.title === topSymptom)
                    .sort((a, b) => {
                        const [d1, m1, y1] = a.date.split('.');
                        const [d2, m2, y2] = b.date.split('.');
                        return new Date(Number(y1), Number(m1) - 1, Number(d1)).getTime() - new Date(Number(y2), Number(m2) - 1, Number(d2)).getTime();
                    })
                    .slice(-7); // Last 7 entries

                if (chartPoints.length > 1) {
                    setChartData({
                        title: topSymptom,
                        labels: chartPoints.map(p => p.date.slice(0, 5)),
                        data: chartPoints.map(p => p.severity)
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const getSeverityColor = (sev: number) => {
        if (sev <= 3) return 'bg-green-100 text-green-700';
        if (sev <= 7) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-secondary-900">Symptom-Tagebuch</Text>
                </View>
                <TouchableOpacity onPress={() => router.push({ pathname: '/symptom/add', params: { petId: id } })}>
                    <Ionicons name="add-circle" size={32} color="#8b5cf6" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5 pt-5">

                {chartData && (
                    <View className="mb-8 p-4 bg-slate-50 rounded-2xl border border-secondary-100">
                        <Text className="font-bold text-secondary-900 mb-2">Verlauf: {chartData.title}</Text>
                        <LineChart
                            data={{
                                labels: chartData.labels,
                                datasets: [{ data: chartData.data }]
                            }}
                            width={screenWidth - 80}
                            height={180}
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#7c3aed" }
                            }}
                            bezier
                            style={{ borderRadius: 16 }}
                            fromZero
                            segments={5}
                        />
                    </View>
                )}

                {symptoms.length === 0 ? (
                    <EmptyState
                        icon="bandage-outline"
                        title="Keine Symptome"
                        description="Erfasse Krankheitsverläufe hier."
                        actionLabel="Neuer Eintrag"
                        onAction={() => router.push({ pathname: '/symptom/add', params: { petId: id } })}
                    />
                ) : (
                    <View className="space-y-4 pb-10">
                        {symptoms.map((item) => (
                            <View key={item.id} className="p-4 rounded-xl border border-secondary-100 bg-white shadow-sm">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View>
                                        <Text className="font-bold text-lg text-secondary-900">{item.title}</Text>
                                        <Text className="text-secondary-500 text-xs">{item.date} • {item.time} Uhr</Text>
                                    </View>
                                    <View className={`px-2 py-1 rounded-lg ${getSeverityColor(item.severity).split(' ')[0]}`}>
                                        <Text className={`font-bold text-xs ${getSeverityColor(item.severity).split(' ')[1]}`}>
                                            Stufe {item.severity}
                                        </Text>
                                    </View>
                                </View>
                                {item.notes && <Text className="text-secondary-600 text-sm mb-2">{item.notes}</Text>}
                                {item.image_uri && (
                                    <Image
                                        source={{ uri: item.image_uri }}
                                        className="w-full h-40 rounded-lg mt-2"
                                        resizeMode="cover"
                                    />
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
