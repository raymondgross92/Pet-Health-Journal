import { Text, TouchableOpacity, ActivityIndicator, Animated, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export default function Button({ label, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, className, icon }: ButtonProps) {
    const { theme } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
        if (!disabled && !loading) onPress();
    };

    const sizeClasses = size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-8 py-4' : 'px-4 py-3';
    const textSizes = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-base';

    // Gradient definitions
    const primaryGradient = theme === 'dark' ? ['#15803d', '#166534'] : ['#4ade80', '#16a34a']; // Fresh Green
    const secondaryGradient = theme === 'dark' ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#f1f5f9'];
    const dangerGradient = ['#ef4444', '#dc2626'];

    const getTextColor = () => {
        if (loading) return 'transparent';
        if (variant === 'primary' || variant === 'danger') return 'text-white';
        return theme === 'dark' ? 'text-slate-200' : 'text-secondary-700';
    };

    const content = (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="w-full">
            <View className={`flex-row items-center justify-center space-x-2`}>
                {loading && <ActivityIndicator color={variant === 'primary' ? 'white' : '#64748b'} className="absolute" />}
                {icon && <View className="mr-2">{icon}</View>}
                <Text className={`font-bold text-center ${getTextColor()} ${textSizes} ${loading ? 'opacity-0' : 'opacity-100'}`}>
                    {label}
                </Text>
            </View>
        </Animated.View>
    );

    if (variant === 'primary' && !disabled) {
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading || disabled}
                className={`rounded-full overflow-hidden shadow-lg shadow-indigo-500/30 ${className}`}
            >
                <LinearGradient
                    colors={primaryGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className={`${sizeClasses} items-center justify-center`}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'danger' && !disabled) {
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading || disabled}
                className={`rounded-full overflow-hidden shadow-lg shadow-red-500/30 ${className}`}
            >
                <LinearGradient
                    colors={dangerGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className={`${sizeClasses} items-center justify-center`}
                >
                    {content}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    // Default / Secondary / Outline
    const containerClass =
        variant === 'outline' ? `border ${theme === 'dark' ? 'border-slate-700' : 'border-secondary-200'}` :
            `bg-secondary-100 ${theme === 'dark' ? 'bg-slate-800' : ''}`;

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading || disabled}
            className={`rounded-full ${containerClass} ${sizeClasses} items-center justify-center ${className}`}
        >
            {content}
        </TouchableOpacity>
    );
}
