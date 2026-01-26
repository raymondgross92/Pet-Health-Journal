import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/utils';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    className?: string;
    icon?: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    label,
    className,
    icon,
    ...props
}: ButtonProps) {
    const baseStyles = 'items-center justify-center rounded-xl flex-row';

    const variants = {
        primary: 'bg-primary-600 active:bg-primary-700',
        secondary: 'bg-secondary-100 active:bg-secondary-200',
        outline: 'border border-secondary-300 bg-transparent active:bg-secondary-50',
    };

    const sizes = {
        sm: 'px-3 py-2',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
    };

    const textBaseStyles = 'font-semibold text-center';

    const textVariants = {
        primary: 'text-white',
        secondary: 'text-secondary-900',
        outline: 'text-secondary-700',
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    return (
        <TouchableOpacity
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            onPress={(e) => {
                Haptics.selectionAsync();
                props.onPress?.(e);
            }}
            {...props}
        >
            {icon && <View className="mr-2">{icon}</View>}
            <Text className={cn(textBaseStyles, textVariants[variant], textSizes[size])}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}
