import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import { useState } from 'react'; // Removed local state
import * as FileSystem from 'expo-file-system';
// @ts-ignore
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { DevSettings } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useColorScheme } from 'nativewind';
import { getDb } from '../db';

export default function SettingsScreen() {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const { theme, setTheme } = useTheme();

    const exportDatabase = async () => {
        try {
            const dbName = 'pet_health.db';
            // Use legacy constants
            const docDir = FileSystemLegacy.documentDirectory;
            const cacheDir = FileSystemLegacy.cacheDirectory;

            if (!docDir) {
                Alert.alert(t('error'), "Konnte Speicherpfad nicht finden.");
                return;
            }

            const dbDir = docDir + 'SQLite/';
            const possiblePaths = [
                dbDir + dbName,
                docDir + dbName
            ];

            let dbFileUri = null;

            for (const path of possiblePaths) {
                const info = await FileSystemLegacy.getInfoAsync(path);
                if (info.exists) {
                    dbFileUri = path;
                    break;
                }
            }

            if (!dbFileUri) {
                Alert.alert(t('error'), t('db_not_found'));
                return;
            }

            // Copy to cache dir to share with a proper name
            const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const backupPath = cacheDir + `pet_health_backup_${dateStr}.db`;

            await FileSystemLegacy.copyAsync({
                from: dbFileUri,
                to: backupPath
            });

            await Sharing.shareAsync(backupPath);
        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), t('backup_failed'));
        }
    };

    const importDatabase = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            if (!asset.name.endsWith('.db')) {
                Alert.alert(t('error'), "Bitte wähle eine gültige .db Datenbank-Datei aus.");
                return;
            }

            Alert.alert(
                t('import_confirm_title'),
                t('import_confirm_msg'),
                [
                    { text: t('cancel'), style: "cancel" },
                    {
                        text: t('restore_yes'),
                        style: "destructive",
                        onPress: async () => {
                            try {
                                const dbName = 'pet_health.db';
                                const docDir = FileSystemLegacy.documentDirectory;
                                const dbDir = docDir + 'SQLite/';

                                // Ensure directory exists
                                const dirInfo = await FileSystemLegacy.getInfoAsync(dbDir);
                                if (!dirInfo.exists) {
                                    await FileSystemLegacy.makeDirectoryAsync(dbDir, { intermediates: true });
                                }

                                const targetPath = dbDir + dbName;

                                await FileSystemLegacy.copyAsync({
                                    from: asset.uri,
                                    to: targetPath
                                });

                                Alert.alert(
                                    t('success'),
                                    t('restore_success'),
                                    [{
                                        text: "OK", onPress: () => {
                                            try { DevSettings.reload(); } catch (e) { }
                                        }
                                    }]
                                );
                            } catch (e) {
                                console.error(e);
                                Alert.alert(t('error'), "Import fehlgeschlagen.");
                            }
                        }
                    }
                ]
            );

        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), "Fehler beim Auswählen der Datei.");
        }
    };

    const exportJson = async () => {
        try {
            const db = await getDb();
            const pets = await db.getAllAsync('SELECT * FROM pets');
            const logs = await db.getAllAsync('SELECT * FROM logs');
            const medications = await db.getAllAsync('SELECT * FROM medications');
            const vets = await db.getAllAsync('SELECT * FROM vets');
            const expenses = await db.getAllAsync('SELECT * FROM expenses');
            const routines = await db.getAllAsync('SELECT * FROM routines');
            const vaccinations = await db.getAllAsync('SELECT * FROM vaccinations');

            const data = {
                exportDate: new Date().toISOString(),
                pets,
                logs,
                medications,
                vets,
                expenses,
                routines,
                vaccinations
            };

            const jsonString = JSON.stringify(data, null, 2);
            const fileUri = FileSystemLegacy.cacheDirectory + 'pet_health_export.json';

            await FileSystemLegacy.writeAsStringAsync(fileUri, jsonString);
            await Sharing.shareAsync(fileUri);

        } catch (e) {
            console.error(e);
            Alert.alert(t('error'), "JSON Export fehlgeschlagen.");
        }
    };

    console.log('SettingsScreen Render. Theme:', theme);

    return (
        <SafeAreaView key={theme} className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('settings')}</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Appearance Settings */}
                <View className="mb-8">
                    <Text className={`font-medium mb-3 uppercase text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>App-Design</Text>
                    <View className={`rounded-xl p-2 flex-row ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                        <ThemeOption label="System" value="system" current={theme} onSelect={setTheme} />
                        <ThemeOption label="Hell" value="light" current={theme} onSelect={setTheme} />
                        <ThemeOption label="Dunkel" value="dark" current={theme} onSelect={setTheme} />
                    </View>
                </View>

                {/* Language Section */}
                <View className="mb-8">
                    <Text className={`font-medium mb-3 uppercase text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{t('general')}</Text>
                    <View className={`rounded-xl p-4 flex-row justify-between items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                        <View className="flex-row items-center space-x-3">
                            <Ionicons name="globe-outline" size={24} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                            <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('language')}</Text>
                        </View>
                        <View className={`flex-row rounded-lg p-1 border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-secondary-200'}`}>
                            <TouchableOpacity
                                onPress={() => setLanguage('de')}
                                className={`px-3 py-1 rounded-md ${language === 'de' ? (theme === 'dark' ? 'bg-primary-900/50' : 'bg-primary-100') : 'bg-transparent'}`}
                            >
                                <Text className={`text-xs font-bold ${language === 'de' ? (theme === 'dark' ? 'text-primary-300' : 'text-primary-700') : (theme === 'dark' ? 'text-slate-500' : 'text-secondary-500')}`}>DE</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setLanguage('en')}
                                className={`px-3 py-1 rounded-md ${language === 'en' ? (theme === 'dark' ? 'bg-primary-900/50' : 'bg-primary-100') : 'bg-transparent'}`}
                            >
                                <Text className={`text-xs font-bold ${language === 'en' ? (theme === 'dark' ? 'text-primary-300' : 'text-primary-700') : (theme === 'dark' ? 'text-slate-500' : 'text-secondary-500')}`}>EN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Data Management Section */}
                <View className="mb-8">
                    <Text className={`font-medium mb-3 uppercase text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{t('data_management')}</Text>
                    <View className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>

                        <TouchableOpacity
                            onPress={() => router.push('/settings/sync')}
                            className={`p-4 flex-row justify-between items-center border-b active:bg-secondary-100 ${theme === 'dark' ? 'border-slate-800 active:bg-slate-800' : 'border-secondary-200'}`}
                        >
                            <View className="flex-row items-center space-x-3">
                                <View className={`h-8 w-8 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                                    <Ionicons name="people-outline" size={16} color={theme === 'dark' ? '#a78bfa' : '#7c3aed'} />
                                </View>
                                <View>
                                    <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('sync_partner')}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('sync_partner_desc')}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={exportDatabase}
                            className={`p-4 flex-row justify-between items-center border-b active:bg-secondary-100 ${theme === 'dark' ? 'border-slate-800 active:bg-slate-800' : 'border-secondary-200'}`}
                        >
                            <View className="flex-row items-center space-x-3">
                                <View className={`h-8 w-8 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                                    <Ionicons name="cloud-upload-outline" size={16} color={theme === 'dark' ? '#4ade80' : '#15803d'} />
                                </View>
                                <View>
                                    <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('backup_db')}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('backup_desc')}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={exportJson}
                            className={`p-4 flex-row justify-between items-center border-b active:bg-secondary-100 ${theme === 'dark' ? 'border-slate-800 active:bg-slate-800' : 'border-secondary-200'}`}
                        >
                            <View className="flex-row items-center space-x-3">
                                <View className={`h-8 w-8 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                                    <Ionicons name="document-text-outline" size={16} color={theme === 'dark' ? '#fb923c' : '#c2410c'} />
                                </View>
                                <View>
                                    <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('export_json')}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('export_json_desc')}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={importDatabase}
                            className={`p-4 flex-row justify-between items-center active:bg-secondary-100 ${theme === 'dark' ? 'active:bg-slate-800' : ''}`}
                        >
                            <View className="flex-row items-center space-x-3">
                                <View className={`h-8 w-8 rounded-full items-center justify-center ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                    <Ionicons name="cloud-download-outline" size={16} color={theme === 'dark' ? '#60a5fa' : '#1d4ed8'} />
                                </View>
                                <View>
                                    <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('import_db')}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{t('import_desc')}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                        </TouchableOpacity>

                    </View>
                </View>

                {/* About Section */}
                <View className="mb-8">
                    <Text className={`font-medium mb-3 uppercase text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{t('about')}</Text>
                    <View className={`rounded-xl p-4 flex-row justify-between items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                        <View className="flex-row items-center space-x-3">
                            <Ionicons name="information-circle-outline" size={24} color={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                            <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('version')}</Text>
                        </View>
                        <Text className={theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}>1.3.0</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function ThemeOption({ label, value, current, onSelect }: { label: string, value: any, current: any, onSelect: (v: any) => void }) {
    const isActive = current === value;
    // We access the global theme by checking if the current active/system theme resolves to 'dark'.
    // However, here 'current' is the state value (system, light, dark).
    // To properly style, we ideally need to know if the APP is currently in dark mode (e.g. system=dark),
    // but for simplicity, we'll style based on if the user selected 'dark'.
    // Wait, the user asked for the DESIGN of the buttons to match the mode.

    // Let's use simple logic: If 'current' is 'dark' OR 'system' (and system is dark.. hard to know here without hook),
    // we should simply rely on passing the "isAppDark" prop or similar?
    // Actually, let's just use `useColorScheme` here to know if we are currently dark?
    // No, we are outside component tree potentially if defined outside.
    // Let's just define colors dynamically based on if THIS button is active.

    // If active: White bg (light mode), Slate-700 bg (dark mode)
    // We can't easily know "current app mode" inside this isolated function without hook.
    // Let's move this component INSIDE SettingsScreen or use a hook.
    // For now, let's just make sure "Active" looks distinguishable in dark mode.
    // Standard approach: Active = High contrast background.

    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const activeBgCallback = () => {
        if (!isActive) return 'transparent';
        return isDark ? '#334155' : '#ffffff'; // Slate-700 vs White
    };

    const activeTextCallback = () => {
        if (isActive) return isDark ? '#ffffff' : '#0f172a';
        return isDark ? '#94a3b8' : '#64748b';
    };

    return (
        <TouchableOpacity
            onPress={() => onSelect(value)}
            className="flex-1 py-2 items-center rounded-lg"
            style={{
                backgroundColor: activeBgCallback(),
                shadowColor: isActive ? '#000' : undefined,
                shadowOffset: isActive ? { width: 0, height: 1 } : undefined,
                shadowOpacity: isActive ? 0.05 : 0,
                shadowRadius: isActive ? 1 : 0,
                elevation: isActive ? 1 : 0,
            }}
        >
            <Text
                className="font-bold font-sans"
                style={{ color: activeTextCallback() }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}
