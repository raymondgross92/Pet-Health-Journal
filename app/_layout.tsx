import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDatabase } from "../db";
import "../global.css";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Nunito_400Regular,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Nunito_800ExtraBold,
    });

    useEffect(() => {
        initDatabase();
    }, []);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <LanguageProvider>
            <ThemeProvider>
                <AppNavigator />
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
