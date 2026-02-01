import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from "../db";
import "../global.css";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Nunito_800ExtraBold,
    });

    useEffect(() => {
        initDatabase();
    }, []);

    // Check Onboarding Status
    useEffect(() => {
        if (!fontsLoaded) return;

        const checkOnboarding = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
                if (hasSeen !== 'true') {
                    // Slight delay to ensure navigation is ready
                    setTimeout(() => router.replace('/onboarding'), 100);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkOnboarding();
    }, [fontsLoaded]);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    import { AuthProvider } from "../context/AuthContext";
    import LockScreen from "../components/LockScreen";

    // ... existing imports

    return (
        <LanguageProvider>
            <ThemeProvider>
                <AuthProvider>
                    <LockScreen />
                    <AppNavigator />
                </AuthProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
}

function AppNavigator() {
    const { theme } = useTheme();

    return (
        <Stack key={theme} screenOptions={{ headerShown: false }}>
            {/* 
              We can force the background color of the navigator container to match the theme 
              to prevent white flashes during transitions. 
            */}
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="pet/[id]" />
            <Stack.Screen name="pet/edit/[id]" />
            <Stack.Screen name="pet/log/[id]" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
