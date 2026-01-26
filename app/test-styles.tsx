import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function TestScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-blue-500">
            <Text className="text-white text-2xl font-bold">NativeWind Test</Text>
            <View className="w-20 h-20 bg-red-500 mt-4 rounded-full" />
            <Link href="/" className="mt-10 text-white underline">Go Home</Link>
        </View>
    );
}
