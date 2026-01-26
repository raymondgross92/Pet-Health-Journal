import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, setColorScheme } = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme) {
                setTheme(savedTheme as Theme);
            }
        } catch (e) {
            console.error('Failed to load theme', e);
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            AsyncStorage.setItem('user-theme', newTheme);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    useEffect(() => {
        // Apply theme asynchronously to prevent render clashes/crashes during navigation or state updates
        const timeout = setTimeout(() => {
            console.log('Applying theme:', theme);
            try {
                setColorScheme(theme);
            } catch (e) {
                console.error('Error setting color scheme:', e);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
