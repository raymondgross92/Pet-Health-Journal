import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { getDb } from '../../db';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Pet } from '../../types';

export default function ReportConfigScreen() {
    const { petId } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState<'all' | 'year' | 'month'>('all');

    const generatePdf = async () => {
        setLoading(true);
        try {
            const db = await getDb();
            const pet = await db.getFirstAsync<Pet>('SELECT * FROM pets WHERE id = ?', Number(petId));

            if (!pet) {
                Alert.alert("Fehler", "Tier nicht gefunden");
                return;
            }

            // Calculate Date Range
            let dateFilter = "";
            const now = new Date();
            if (period === 'month') {
                now.setMonth(now.getMonth() - 1);
                // Simple string compare for DD.MM.YYYY is tricky, so we filter in JS or use ISO dates.
                // Our dates are DD.MM.YYYY. Let's filter in JS for simplicity.
            } else if (period === 'year') {
                now.setFullYear(now.getFullYear() - 1);
            }

            const logs = await db.getAllAsync<any>('SELECT * FROM logs WHERE pet_id = ? ORDER BY date DESC', Number(petId));
            const meds = await db.getAllAsync<any>('SELECT * FROM medications WHERE pet_id = ?', Number(petId));
            const vaccs = await db.getAllAsync<any>('SELECT * FROM vaccinations WHERE pet_id = ?', Number(petId));
            // Vets are global, not per pet
            const vets = await db.getAllAsync<any>('SELECT * FROM vets');

            // JS Filter
            const filteredLogs = logs.filter(l => {
                if (period === 'all') return true;
                const [d, m, y] = l.date.split('.');
                const logDate = new Date(Number(y), Number(m) - 1, Number(d));
                return logDate >= now;
            });

            // HTML Generation
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                        h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
                        h2 { margin-top: 30px; color: #4b5563; font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .pet-info { font-size: 14px; }
                        .param-label { font-weight: bold; color: #6b7280; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                        th { text-align: left; background: #f3f4f6; padding: 8px; color: #374151; }
                        td { border-bottom: 1px solid #e5e7eb; padding: 8px; }
                        .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white; }
                        .bg-red { background: #ef4444; }
                        .bg-blue { background: #3b82f6; }
                        .bg-green { background: #10b981; }
                        .bg-gray { background: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>Gesundheitsbericht</h1>
                            <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
                        </div>
                        <div class="pet-info">
                            <p><span class="param-label">Name:</span> ${pet.name}</p>
                            <p><span class="param-label">Art:</span> ${pet.species} ${pet.breed ? `(${pet.breed})` : ''}</p>
                            <p><span class="param-label">Geboren:</span> ${pet.date_of_birth}</p>
                            <p><span class="param-label">Gewicht:</span> ${pet.weight} kg</p>
                        </div>
                    </div>

                    <h2>Letzte Aktivitäten / Tagebuch</h2>
                    ${filteredLogs.length === 0 ? '<p>Keine Einträge im gewählten Zeitraum.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th width="20%">Datum</th>
                                <th width="20%">Typ</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredLogs.map(l => `
                                <tr>
                                    <td>${l.date}</td>
                                    <td>
                                        <span class="badge ${l.type === 'Impfung' ? 'bg-red' : l.type === 'Tierarzt' ? 'bg-blue' : l.type === 'Gewicht' ? 'bg-green' : 'bg-gray'}">
                                            ${l.type}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>${l.title}</strong><br/>
                                        <span style="color:#666">${l.description || ''}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}

                    <h2>Aktuelle Medikamente & Vorrat</h2>
                    ${meds.length === 0 ? '<p>Keine Medikamente.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Dosierung</th>
                                <th>Vorrat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${meds.map((m: any) => `
                                <tr>
                                    <td>${m.name}</td>
                                    <td>${m.dosage}</td>
                                    <td>${m.stock}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}

                    <h2>Impfstatus</h2>
                    ${vaccs.length === 0 ? '<p>Keine Impfungen erfasst.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th>Impfung</th>
                                <th>Datum</th>
                                <th>Nächste Fälligkeit</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vaccs.map((v: any) => `
                                <tr>
                                    <td>${v.name}</td>
                                    <td>${v.date}</td>
                                    <td>${v.next_date || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}
                    
                    <h2>Tierärzte</h2>
                     ${vets.length === 0 ? '<p>Keine Tierärzte hinterlegt.</p>' : `
                    <ul>
                        ${vets.map((v: any) => `<li><strong>${v.name}</strong> - ${v.phone || ''} (${v.address || ''})</li>`).join('')}
                    </ul>
                    `}
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);

        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "PDF konnte nicht erstellt werden.");
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
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('report_title')}</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">
                <Text className={`mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-600'}`}>{t('report_desc')}</Text>

                <Text className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('report_period')}</Text>

                <TouchableOpacity onPress={() => setPeriod('all')} className={`p-4 rounded-xl border mb-3 flex-row justify-between items-center ${period === 'all' ? 'bg-primary-50 border-primary-500' : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100')}`}>
                    <Text className={`font-medium ${period === 'all' ? 'text-primary-700' : (theme === 'dark' ? 'text-white' : 'text-secondary-700')}`}>{t('report_all_time')}</Text>
                    {period === 'all' && <Ionicons name="checkmark-circle" size={24} color="#059669" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setPeriod('year')} className={`p-4 rounded-xl border mb-3 flex-row justify-between items-center ${period === 'year' ? 'bg-primary-50 border-primary-500' : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100')}`}>
                    <Text className={`font-medium ${period === 'year' ? 'text-primary-700' : (theme === 'dark' ? 'text-white' : 'text-secondary-700')}`}>{t('report_last_year')}</Text>
                    {period === 'year' && <Ionicons name="checkmark-circle" size={24} color="#059669" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setPeriod('month')} className={`p-4 rounded-xl border mb-8 flex-row justify-between items-center ${period === 'month' ? 'bg-primary-50 border-primary-500' : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100')}`}>
                    <Text className={`font-medium ${period === 'month' ? 'text-primary-700' : (theme === 'dark' ? 'text-white' : 'text-secondary-700')}`}>{t('report_last_month')}</Text>
                    {period === 'month' && <Ionicons name="checkmark-circle" size={24} color="#059669" />}
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color="#059669" />
                ) : (
                    <TouchableOpacity
                        onPress={generatePdf}
                        className="bg-primary-600 p-4 rounded-xl flex-row justify-center items-center shadow-md shadow-primary-200"
                    >
                        <Ionicons name="document-text" size={24} color="white" className="mr-2" />
                        <Text className="text-white font-bold text-lg ml-2">{t('report_generate')}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
