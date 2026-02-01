import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Platform } from 'react-native';

export default function TabLayout() {
    const { theme } = useTheme();
    const { t } = useLanguage();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme === 'dark' ? '#0c0a09' : '#ffffff',
                    borderTopColor: theme === 'dark' ? '#1c1917' : '#e5e5e5',
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: theme === 'dark' ? '#4ade80' : '#16a34a',
                tabBarInactiveTintColor: theme === 'dark' ? '#78716c' : '#a8a29e',
                tabBarLabelStyle: {
                    fontFamily: 'System',
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tab_home'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: "Kalender",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="care"
                options={{
                    title: t('tab_care'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medkit" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: t('tab_settings'),
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
