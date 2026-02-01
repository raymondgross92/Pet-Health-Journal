import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { exportData, importData } from '../../lib/backup';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function SettingsScreen() {
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { isBiometricsEnabled, enableBiometrics, disableBiometrics } = useAuth();
    const [biometricsLoading, setBiometricsLoading] = useState(false);

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const toggleBiometrics = async (value: boolean) => {
        setBiometricsLoading(true);
        if (value) {
            const success = await enableBiometrics();
            if (!success) {
                Alert.alert("Fehler", "Biometrie konnte nicht aktiviert werden oder ist nicht verfügbar.");
            }
        } else {
            await disableBiometrics();
        }
        setBiometricsLoading(false);
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-6 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <Text className={`text-3xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('settings_title')}</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Appearance */}
                <View className="mb-8">
                    <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>{t('appearance')}</Text>
                    <View className={`p-4 rounded-xl flex-row justify-between items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        <View className="flex-row items-center">
                            <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={24} color={theme === 'dark' ? '#818cf8' : '#f59e0b'} className="mr-3" />
                            <Text className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('dark_mode')}</Text>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View className="mb-8">
                    <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Sicherheit</Text>
                    <View className={`p-4 rounded-xl flex-row justify-between items-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        <View className="flex-row items-center">
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-green-100'}`}>
                                <Ionicons name="finger-print" size={20} color={theme === 'dark' ? '#fff' : '#16a34a'} />
                            </View>
                            <View>
                                <Text className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>App Sperre</Text>
                                <Text className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>FaceID / TouchID</Text>
                            </View>
                        </View>
                        <Switch
                            value={isBiometricsEnabled}
                            onValueChange={toggleBiometrics}
                            disabled={biometricsLoading}
                            trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                        />
                    </View>
                </View>

                {/* Data & Backup */}
                <View className="mb-8">
                    <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Daten & Speicher</Text>
                    <View className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        <TouchableOpacity
                            onPress={exportData}
                            className={`p-4 flex-row items-center border-b ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}
                        >
                            <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                                <Ionicons name="cloud-upload" size={20} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Backup erstellen</Text>
                                <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Sichere alle deine Daten</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={importData}
                            className="p-4 flex-row items-center"
                        >
                            <View className="h-10 w-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                                <Ionicons name="cloud-download" size={20} color="#ea580c" />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Backup importieren</Text>
                                <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>Daten wiederherstellen</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About */}
                <View className="mb-8">
                    <Text className={`text-sm font-bold uppercase mb-3 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-500'}`}>Über</Text>
                    <View className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                        <TouchableOpacity className="flex-row justify-between items-center mb-4">
                            <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Version</Text>
                            <Text className={theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}>{appVersion}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/raymondgross92/Pet-Health-Journal')} className="flex-row justify-between items-center">
                            <Text className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>GitHub</Text>
                            <Ionicons name="logo-github" size={20} color={theme === 'dark' ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text className="text-center text-xs text-gray-400 mt-4">Made with ❤️ by Agentic AI</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
