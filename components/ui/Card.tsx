import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps extends ViewProps {
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onPress?: () => void;
}

export default function Card({ children, style, variant = 'default', padding = 'md', className, onPress, ...props }: CardProps) {
    const { theme } = useTheme();

    const paddingClass =
        padding === 'none' ? '' :
            padding === 'sm' ? 'p-3' :
                padding === 'lg' ? 'p-6' : 'p-4';

    const baseClass = `rounded-3xl ${paddingClass} ${className || ''}`;

    // Light Mode Styles
    const lightStyle =
        variant === 'elevated' ? 'bg-white shadow-lg shadow-stone-200/50' :
            variant === 'outlined' ? 'bg-transparent border border-secondary-200' :
                'bg-white border border-secondary-100 shadow-sm shadow-stone-200';

    // Dark Mode Styles
    const darkStyle =
        variant === 'elevated' ? 'bg-secondary-900 shadow-lg shadow-black/50 border border-secondary-800' :
            variant === 'outlined' ? 'bg-transparent border border-secondary-700' :
                'bg-secondary-900 border border-secondary-800';

    const finalClass = `${baseClass} ${theme === 'dark' ? darkStyle : lightStyle}`;

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} className={finalClass} activeOpacity={0.7} {...(props as any)}>
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View className={finalClass} {...props}>
            {children}
        </View>
    );
}
