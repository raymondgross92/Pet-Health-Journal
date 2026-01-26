import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import EmptyState from '../../components/ui/EmptyState';

import { Pet, Log } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function PetDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [pet, setPet] = useState<Pet | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [docs, setDocs] = useState<any[]>([]); // Added docs state
    const [loading, setLoading] = useState(true);
    const [weightHistory, setWeightHistory] = useState<{ labels: string[], data: number[] } | null>(null);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getFirstAsync<Pet>(
                'SELECT * FROM pets WHERE id = ?',
                Number(id)
            );
            setPet(result);

            const logsResult = await db.getAllAsync<Log>(
                'SELECT * FROM logs WHERE pet_id = ? ORDER BY id DESC',
                Number(id)
            );
            setLogs(logsResult);

            const docsResult = await db.getAllAsync<any>(
                'SELECT * FROM documents WHERE pet_id = ? ORDER BY id DESC',
                Number(id)
            );
            setDocs(docsResult);

            // Filter and process weight logs
            const weightLogs = logsResult
                .filter(l => l.type === 'Gewicht')
                .sort((a, b) => {
                    const [d1, m1, y1] = a.date.split('.');
                    const [d2, m2, y2] = b.date.split('.');
                    return new Date(Number(y1), Number(m1) - 1, Number(d1)).getTime() - new Date(Number(y2), Number(m2) - 1, Number(d2)).getTime();
                })
                .slice(-6);

            if (weightLogs.length >= 2) {
                setWeightHistory({
                    labels: weightLogs.map(l => l.date.slice(0, 5)), // "DD.MM"
                    data: weightLogs.map(l => {
                        // Simplified: Just try to parse text as number
                        const val = parseFloat(l.description.replace(',', '.'));
                        if (!isNaN(val)) return val;

                        // Fallback to title
                        const titleVal = parseFloat(l.title.replace(',', '.'));
                        return !isNaN(titleVal) ? titleVal : 0;
                    })
                });
            } else {
                setWeightHistory(null);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Daten nicht laden');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const handleDelete = () => {
        Alert.alert(
            "Löschen bestätigen",
            "Möchtest du dieses Haustier wirklich löschen? Alle Einträge gehen verloren.",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const db = await getDb();
                            await db.runAsync('DELETE FROM pets WHERE id = ?', [Number(id)]);
                            router.back();
                        } catch (e) { console.error(e); }
                    }
                }
            ]
        );
    };

    const generatePdf = async () => {
        if (!pet) return;

        const html = `
            <html>
                <body style="font-family: Helvetica, sans-serif; padding: 20px;">
                    <h1>Gesundheitsbericht: ${pet.name}</h1>
                    <p><strong>Rasse:</strong> ${pet.breed || '-'}</p>
                    <p><strong>Geboren:</strong> ${pet.date_of_birth || '-'}</p>
                    <hr />
                    <h2>Einträge</h2>
                    <ul>
                        ${logs.map(log => `
                            <li>
                                <strong>${log.date} - ${log.type}:</strong> ${log.title}<br/>
                                ${log.description || ''}
                            </li>
                        `).join('')}
                    </ul>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (e) {
            Alert.alert("Fehler", "PDF konnte nicht erstellt werden.");
        }
    };

    const generateEmergencyPass = async () => {
        if (!pet) return;
        try {
            const db = await getDb();
            // Fetch emergency vet
            const emVet = await db.getAllAsync<any>('SELECT * FROM vets WHERE emergency = 1 LIMIT 1');
            const emergencyVet = emVet.length > 0 ? emVet[0] : null;

            // Fetch current medications
            const petMeds = await db.getAllAsync<any>('SELECT * FROM medications WHERE pet_id = ?', [pet.id]);

            // Fetch last vaccinations
            const petVacs = await db.getAllAsync<any>('SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY date DESC', [pet.id]);

            const html = `
                <html>
                    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.4; padding: 20px;">
                        <div style="border: 2px solid #8b5cf6; border-radius: 15px; padding: 20px; max-width: 500px; margin: auto;">
                            <h1 style="color: #8b5cf6; text-align: center; margin-top: 0;">NOTFALL-PASS</h1>
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h2 style="margin: 0;">${pet.name}</h2>
                                <p style="margin: 5px 0;">${pet.species} • ${pet.breed || '-'}</p>
                            </div>

                            <div style="margin-bottom: 15px;">
                                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Basis Infos</h3>
                                <p><strong>Geburtstag:</strong> ${pet.date_of_birth || '-'}</p>
                                <p><strong>Gewicht:</strong> ${pet.weight} kg</p>
                            </div>

                            ${petMeds.length > 0 ? `
                            <div style="margin-bottom: 15px;">
                                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Medikamente</h3>
                                <ul style="padding-left: 20px;">
                                    ${petMeds.map(m => `<li>${m.name} (${m.dosage}) - ${m.frequency}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}

                            ${petVacs.length > 0 ? `
                            <div style="margin-bottom: 15px;">
                                <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">Letzte Impfungen</h3>
                                <ul style="padding-left: 20px;">
                                    ${petVacs.slice(0, 3).map(v => `<li>${v.name} (${v.date})</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}

                            ${emergencyVet ? `
                            <div style="background-color: #fee2e2; padding: 10px; border-radius: 10px; margin-top: 20px;">
                                <h3 style="color: #ef4444; margin-top: 0;">Notfall Tierarzt</h3>
                                <p style="margin: 0;"><strong>${emergencyVet.name}</strong></p>
                                <p style="margin: 5px 0;">Tel: ${emergencyVet.phone || '-'}</p>
                            </div>
                             ` : ''}

                            <div style="margin-top: 30px; font-size: 12px; text-align: center; color: #666;">
                                <p>Generiert mit Pet Health Journal</p>
                            </div>
                        </div>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Notfall-Pass konnte nicht generiert werden.");
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                type: ['application/pdf', 'image/*']
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            // @ts-ignore
            const savedUri = (FileSystem.documentDirectory || '') + (asset.name || 'doc_' + Date.now());

            await FileSystem.copyAsync({
                from: asset.uri,
                to: savedUri
            });

            const db = await getDb();
            await db.runAsync(
                'INSERT INTO documents (pet_id, title, uri, type, date) VALUES (?, ?, ?, ?, ?)',
                [Number(id), asset.name, savedUri, asset.mimeType || 'unknown', new Date().toLocaleDateString('de-DE')]
            );
            loadData();

        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Dokument konnte nicht geladen werden.");
        }
    };

    const openDocument = async (uri: string) => {
        try {
            // Check if file exists
            const info = await FileSystem.getInfoAsync(uri);
            if (!info.exists) {
                Alert.alert("Fehler", "Datei nicht mehr gefunden.");
                return;
            }
            await Sharing.shareAsync(uri);
        } catch (e) {
            Alert.alert("Fehler", "Konnte Dokument nicht öffnen.");
        }
    };

    if (loading || !pet) {
        return (
            <View className="flex-1 items-center justify-center bg-secondary-50">
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <ScrollView className="flex-1">
                {/* Header Image */}
                <View className="relative">
                    <Image
                        source={pet.image_uri ? { uri: pet.image_uri } : { uri: 'https://placehold.co/600x400/8b5cf6/ffffff?text=No+Image' }}
                        className="w-full h-72 rounded-b-[40px]"
                        style={{ resizeMode: 'cover' }}
                    />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className={`absolute top-4 left-4 p-2 rounded-full ${theme === 'dark' ? 'bg-black/40' : 'bg-white/30 backdrop-blur-md'}`}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={generatePdf}
                        className={`absolute top-4 right-4 p-2 rounded-full ${theme === 'dark' ? 'bg-black/40' : 'bg-white/30 backdrop-blur-md'}`}
                    >
                        <Ionicons name="share-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={generateEmergencyPass}
                        className={`absolute top-16 right-4 p-2 rounded-full ${theme === 'dark' ? 'bg-red-900/40' : 'bg-red-500/30 backdrop-blur-md'}`}
                    >
                        <Ionicons name="alert-circle" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View className="px-5 -mt-12 mb-6">
                    <View className={`rounded-3xl p-6 shadow-md ${theme === 'dark' ? 'bg-slate-900 shadow-none border border-slate-800' : 'bg-white shadow-secondary-200'}`}>
                        <View className="flex-row justify-between items-start mb-2">
                            <View>
                                <Text className={`text-3xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{pet.name}</Text>
                                <Text className={`font-medium font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{pet.breed || 'Mischling'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push(`/pet/edit/${pet.id}`)}>
                                <Ionicons name="create-outline" size={24} color={theme === 'dark' ? '#818cf8' : '#8b5cf6'} />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row justify-between mt-4">
                            <View className={`items-center p-3 rounded-2xl flex-1 mr-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-primary-50'}`}>
                                <Text className={`text-xs uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Gewicht</Text>
                                <Text className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{pet.weight} kg</Text>
                            </View>
                            <View className={`items-center p-3 rounded-2xl flex-1 ml-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-primary-50'}`}>
                                <Text className={`text-xs uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Alter/Geb.</Text>
                                <Text className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{pet.date_of_birth}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Weight Chart */}
                {weightHistory && weightHistory.data.length > 1 && (
                    <View className="px-5 mb-8">
                        <Text className={`text-xl font-bold mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Gewichtsverlauf</Text>
                        <LineChart
                            data={{
                                labels: weightHistory.labels,
                                datasets: [{ data: weightHistory.data }]
                            }}
                            width={screenWidth - 40}
                            height={220}
                            yAxisSuffix="kg"
                            chartConfig={{
                                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                                backgroundGradientFrom: theme === 'dark' ? '#0f172a' : '#ffffff',
                                backgroundGradientTo: theme === 'dark' ? '#0f172a' : '#ffffff',
                                decimalPlaces: 1,
                                color: (opacity = 1) => theme === 'dark' ? `rgba(129, 140, 248, ${opacity})` : `rgba(139, 92, 246, ${opacity})`,
                                labelColor: (opacity = 1) => theme === 'dark' ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "5", strokeWidth: "2", stroke: theme === 'dark' ? "#818cf8" : "#7c3aed" },
                                propsForBackgroundLines: {
                                    strokeDasharray: "", // solid lines
                                    stroke: theme === 'dark' ? "#334155" : "#e2e8f0"
                                }
                            }}
                            bezier
                            style={{ borderRadius: 16, paddingRight: 40 }}
                        />
                    </View>
                )}

                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('doc_safe')}</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/pet/[id]/vaccinations', params: { id } })}>
                            <Text className={`font-bold text-sm mr-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{t('impfpass')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-end mb-4">
                        <TouchableOpacity onPress={pickDocument}>
                            <Text className={`font-bold font-sans ${theme === 'dark' ? 'text-primary-400' : 'text-primary-500'}`}>+ {t('doc_upload')}</Text>
                        </TouchableOpacity>
                    </View>

                    {docs.length === 0 ? (
                        <EmptyState
                            icon="document-text-outline"
                            title={t('no_docs')}
                            description="Lade wichtige PDF oder Bilder hoch."
                            actionLabel={t('doc_upload')}
                            onAction={pickDocument}
                        />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {docs.map(doc => (
                                <TouchableOpacity
                                    key={doc.id}
                                    onPress={() => openDocument(doc.uri)}
                                    className={`mr-3 p-3 rounded-2xl border shadow-sm w-32 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                                >
                                    <View className={`h-16 rounded-xl items-center justify-center mb-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-50'}`}>
                                        <Ionicons name="document" size={32} color={theme === 'dark' ? '#8b5cf6' : '#8b5cf6'} />
                                    </View>
                                    <Text numberOfLines={2} className={`text-sm font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{doc.title}</Text>
                                    <Text className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{doc.date}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Journal Logs */}
                <View className="px-5 mb-24">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('health_journal')}</Text>
                        <Button
                            label="Eintrag +"
                            size="sm"
                            onPress={() => router.push({ pathname: '/pet/add-log', params: { petId: id } })}
                        />
                    </View>

                    {logs.length === 0 ? (
                        <EmptyState
                            icon="medical"
                            title={t('no_entries')}
                            description="Erfasse Tierarztbesuche, Gewicht und mehr."
                            actionLabel={t('entry_add')}
                            onAction={() => router.push({ pathname: '/pet/add-log', params: { petId: id } })}
                        />
                    ) : (
                        <View className="space-y-3">
                            {logs.map((log) => (
                                <TouchableOpacity
                                    key={log.id}
                                    onPress={() => router.push({ pathname: '/pet/log/[id]', params: { id: log.id } })}
                                    className={`p-4 rounded-xl border shadow-sm active:opacity-70 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                                >
                                    <View className="flex-row justify-between items-start mb-1">
                                        <View className={`px-2 py-0.5 rounded-md ${log.type === 'Impfung' ? (theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100') :
                                            log.type === 'Tierarzt' ? (theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100') :
                                                (theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-100')
                                            }`}>
                                            <Text className={`text-xs font-medium ${log.type === 'Impfung' ? (theme === 'dark' ? 'text-red-300' : 'text-red-700') :
                                                log.type === 'Tierarzt' ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-700') :
                                                    (theme === 'dark' ? 'text-slate-300' : 'text-secondary-700')
                                                }`}>{log.type}</Text>
                                        </View>
                                        <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{log.date}</Text>
                                    </View>
                                    <Text className={`font-bold text-base mb-1 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{log.title}</Text>
                                    {log.description && (
                                        <Text className={`text-sm leading-5 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{log.description}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleDelete}
                        className="mt-8 self-center"
                    >
                        <Text className="text-red-500 font-bold font-sans">Haustier löschen</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
