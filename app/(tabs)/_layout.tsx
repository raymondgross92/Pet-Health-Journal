import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import '../../global.css';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0', // slate-200
                    height: 60,
                    paddingBottom: 5,
                },
                tabBarActiveTintColor: '#059669', // primary-600
                tabBarInactiveTintColor: '#64748b', // secondary-500
            }}
            screenListeners={{
                tabPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'Kalender',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="care"
                options={{
                    title: 'Betreuung',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medkit-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pets"
                options={{
                    title: 'Pets',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="paw-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
