import { TextInput, View, Text, TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export default function Input({ label, error, containerClassName, className, ...props }: InputProps) {
    return (
        <View className={cn("mb-4", containerClassName)}>
            {label && (
                <Text className="text-secondary-700 font-medium mb-1.5 ml-1">
                    {label}
                </Text>
            )}
            <TextInput
                className={cn(
                    "bg-white border border-secondary-200 rounded-xl px-4 py-3 text-secondary-900 text-base",
                    "focus:border-primary-500",
                    error && "border-red-500",
                    className
                )}
                placeholderTextColor="#94a3b8"
                {...props}
            />
            {error && (
                <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
            )}
        </View>
    );
}
