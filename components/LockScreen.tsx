import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function LockScreen() {
    const { authenticate, isAuthenticated, isBiometricsEnabled } = useAuth();
    const { theme } = useTheme();

    if (!isBiometricsEnabled || isAuthenticated) return null;

    return (
        <View className={`absolute top-0 bottom-0 left-0 right-0 z-50 items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
            <View className="mb-8 items-center">
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-xl shadow-green-900/20"
                >
                    <Ionicons name="lock-closed" size={40} color="white" />
                </LinearGradient>
                <Text className={`text-2xl font-bold mb-2 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>App gesperrt</Text>
                <Text className={`text-center mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Bitte authentifiziere dich, um{'\n'}auf deine Daten zuzugreifen.
                </Text>

                <TouchableOpacity
                    onPress={authenticate}
                    className="flex-row items-center bg-primary-600 px-8 py-4 rounded-full shadow-lg shadow-primary-600/30"
                >
                    <Ionicons name="finger-print" size={24} color="white" className="mr-3" />
                    <Text className="text-white font-bold text-lg font-sans">Entsperren</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
