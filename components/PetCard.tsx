import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { calculateAge } from '../utils/dateUtils';

interface PetCardProps {
    name: string;
    breed: string;
    age: string; // This is the DOB string
    image?: string;
    onPress?: () => void;
}

export default function PetCard({ name, breed, age, image, onPress }: PetCardProps) {
    const { theme } = useTheme();
    const displayAge = calculateAge(age);
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-2xl p-4 shadow-sm border flex-row items-center space-x-4 mb-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
        >
            <View className={`h-16 w-16 rounded-full items-center justify-center overflow-hidden border ${theme === 'dark' ? 'bg-primary-900/30 border-primary-900' : 'bg-primary-100 border-primary-200'}`}>
                {image ? (
                    <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
                ) : (
                    <Ionicons name="paw" size={32} color={theme === 'dark' ? '#10b981' : '#059669'} />
                )}
            </View>

            <View className="flex-1">
                <Text className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{name}</Text>
                <Text className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>{breed}</Text>
            </View>

            <View className={`px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-50'}`}>
                <Text className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-600'}`}>{displayAge}</Text>
            </View>
        </TouchableOpacity>
    );
}
