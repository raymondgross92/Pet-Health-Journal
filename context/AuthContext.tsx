import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isAuthenticated: boolean;
    isBiometricsEnabled: boolean;
    enableBiometrics: () => Promise<boolean>;
    disableBiometrics: () => Promise<void>;
    authenticate: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Default false if enabled, true if disabled
    const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        checkSettings();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'background' && isBiometricsEnabled) {
                setIsAuthenticated(false);
            }
            if (nextAppState === 'active' && isBiometricsEnabled && !isAuthenticated) {
                // Optionally auto-trigger auth on resume? 
                // Better let the UI handle the "Authenticate" button to avoid loop issues
            }
        });

        return () => {
            subscription.remove();
        };
    }, [isBiometricsEnabled, isAuthenticated]);

    const checkSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem('biometrics_enabled');
            const enabled = stored === 'true';
            setIsBiometricsEnabled(enabled);

            // If disabled, we are always "authenticated"
            if (!enabled) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoaded(true);
        }
    };

    const enableBiometrics = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
            return false;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Biometrie aktivieren bestätigen',
        });

        if (result.success) {
            await AsyncStorage.setItem('biometrics_enabled', 'true');
            setIsBiometricsEnabled(true);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const disableBiometrics = async () => {
        await AsyncStorage.removeItem('biometrics_enabled');
        setIsBiometricsEnabled(false);
        setIsAuthenticated(true);
    };

    const authenticate = async () => {
        if (!isBiometricsEnabled) return true;

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Bitte entsperren',
        });

        if (result.success) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    if (!isLoaded) return null; // Or Splash

    return (
        <AuthContext.Provider value={{ isAuthenticated, isBiometricsEnabled, enableBiometrics, disableBiometrics, authenticate }}>
            {children}
        </AuthContext.Provider>
    );
};
