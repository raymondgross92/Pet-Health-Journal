import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ icon = 'paw-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
    const { theme } = useTheme();

    return (
        <View className={`rounded-2xl p-8 items-center justify-center border border-dashed my-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-200'}`}>
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-secondary-50'}`}>
                <Ionicons name={icon} size={32} color={theme === 'dark' ? '#94a3b8' : '#cbd5e1'} />
            </View>
            <Text className={`font-bold text-lg text-center mb-1 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-600'}`}>{title}</Text>
            {description && (
                <Text className={`text-center mb-4 font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{description}</Text>
            )}
            {actionLabel && onAction && (
                <Button
                    label={actionLabel}
                    size="sm"
                    variant="secondary"
                    onPress={onAction}
                />
            )}
        </View>
    );
}
