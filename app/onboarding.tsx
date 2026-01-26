import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        key: '1',
        icon: 'paw',
        color: '#8b5cf6',
        titleKey: 'onboarding_1_title',
        descKey: 'onboarding_1_desc',
    },
    {
        key: '2',
        icon: 'heart',
        color: '#ef4444',
        titleKey: 'onboarding_2_title',
        descKey: 'onboarding_2_desc',
    },
    {
        key: '3',
        icon: 'rocket',
        color: '#10b981',
        titleKey: 'onboarding_3_title',
        descKey: 'onboarding_3_desc',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            router.replace('/(tabs)');
        } catch (e) {
            console.error(e);
        }
    };

    const currentSlide = SLIDES[currentIndex];

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
            <View className="flex-1 items-center justify-center px-8">

                {/* Skip Button */}
                <TouchableOpacity
                    onPress={finishOnboarding}
                    className="absolute top-4 right-6 z-10"
                >
                    <Text className={`font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{t('skip')}</Text>
                </TouchableOpacity>

                {/* Animated Content */}
                <Animated.View
                    key={currentIndex}
                    entering={FadeInRight}
                    exiting={FadeOutLeft}
                    className="items-center"
                >
                    <View className={`w-40 h-40 rounded-full items-center justify-center mb-10 shadow-lg shadow-purple-200`} style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#f3f4f6' }}>
                        <Ionicons name={currentSlide.icon as any} size={80} color={currentSlide.color} />
                    </View>

                    <Text className={`text-3xl font-bold text-center mb-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>
                        {t(currentSlide.titleKey as any)}
                    </Text>

                    <Text className={`text-center text-lg leading-6 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'}`}>
                        {t(currentSlide.descKey as any)}
                    </Text>
                </Animated.View>

                {/* Dots Indicator */}
                <View className="flex-row space-x-2 mt-10">
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'w-8 bg-primary-600'
                                    : (theme === 'dark' ? 'w-2 bg-slate-800' : 'w-2 bg-secondary-200')
                                }`}
                        />
                    ))}
                </View>

            </View>

            {/* Bottom Button */}
            <View className="px-8 pb-10">
                <TouchableOpacity
                    onPress={handleNext}
                    className="w-full bg-primary-600 py-4 rounded-2xl items-center shadow-lg shadow-primary-200 active:bg-primary-700"
                >
                    <Text className="text-white font-bold text-lg font-sans">
                        {currentIndex === SLIDES.length - 1 ? t('get_started') : 'Weiter'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
