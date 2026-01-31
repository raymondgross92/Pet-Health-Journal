import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/ui/Button';

export default function SyncScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useLanguage();

    const steps = [
        {
            icon: 'cloud-upload',
            title: '1. Backup erstellen',
            desc: 'Gehe in den Einstellungen auf "Datenbank sichern".'
        },
        {
            icon: 'share-social',
            title: '2. Datei teilen',
            desc: 'Sende die Datei an deinen Partner (z.B. per iCloud, Drive, WhatsApp).'
        },
        {
            icon: 'download',
            title: '3. Importieren',
            desc: 'Dein Partner öffnet die App > Einstellungen > "Datenbank importieren" und wählt die Datei aus.'
        }
    ];

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
            <View className={`px-5 py-4 border-b flex-row items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : '#0f172a'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{t('sync_partner')}</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-8">
                <View className="items-center mb-8">
                    <View className={`h-24 w-24 rounded-full items-center justify-center mb-4 ${theme === 'dark' ? 'bg-primary-900/30' : 'bg-primary-100'}`}>
                        <Ionicons name="people" size={48} color={theme === 'dark' ? '#818cf8' : '#6366f1'} />
                    </View>
                    <Text className={`text-2xl font-bold text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>
                        {t('sync_title')}
                    </Text>
                    <Text className={`text-center ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>
                        {t('sync_desc')}
                    </Text>
                </View>

                <View className={`rounded-2xl p-6 mb-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-secondary-50'}`}>
                    {steps.map((step, index) => (
                        <View key={index} className="flex-row mb-6 last:mb-0">
                            <View className={`h-10 w-10 rounded-full items-center justify-center mr-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                                <Ionicons name={step.icon as any} size={20} color={theme === 'dark' ? '#cbd5e1' : '#475569'} />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-bold text-lg mb-1 ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{step.title}</Text>
                                <Text className={`leading-5 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-600'}`}>{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Button
                    label={t('backup_db')}
                    onPress={() => router.back()} // Go back to settings to do the action
                    icon={<Ionicons name="cloud-upload-outline" size={20} color="white" />}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
