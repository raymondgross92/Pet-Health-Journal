import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface DateTimePickerInputProps {
    label?: string;
    value: Date;
    onChange: (date: Date) => void;
    mode?: 'date' | 'time';
    containerClassName?: string;
}

export default function DateTimePickerInput({ label, value, onChange, mode = 'date', containerClassName = '' }: DateTimePickerInputProps) {
    const [show, setShow] = useState(false);
    const { theme } = useTheme();

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        if (selectedDate) {
            onChange(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        if (mode === 'time') {
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <View className={`mb-4 ${containerClassName}`}>
            {label && <Text className={`font-medium mb-2 ml-1 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-secondary-700'}`}>{label}</Text>}

            <TouchableOpacity
                onPress={() => setShow(true)}
                className={`w-full border rounded-2xl px-4 py-3.5 flex-row justify-between items-center ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-secondary-50 border-secondary-200'
                    }`}
            >
                <Text className={`font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>
                    {formatDate(value)}
                </Text>
                <Ionicons
                    name={mode === 'time' ? "time-outline" : "calendar-outline"}
                    size={20}
                    color={theme === 'dark' ? '#94a3b8' : '#64748b'}
                />
            </TouchableOpacity>

            {/* Android / iOS Modal Picker */}
            {show && (
                Platform.OS === 'ios' ? (
                    <Modal
                        transparent={true}
                        animationType="fade"
                        visible={show}
                        onRequestClose={() => setShow(false)}
                    >
                        <View className="flex-1 justify-center items-center bg-black/50">
                            <View className={`w-[90%] rounded-xl p-4 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                                <DateTimePicker
                                    value={value}
                                    mode={mode}
                                    display="spinner"
                                    onChange={handleChange}
                                    textColor={theme === 'dark' ? 'white' : 'black'}
                                    locale="de-DE"
                                />
                                <TouchableOpacity
                                    onPress={() => setShow(false)}
                                    className="bg-primary-500 py-3 rounded-lg mt-4"
                                >
                                    <Text className="text-white text-center font-bold">Fertig</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={value}
                        mode={mode}
                        display="default"
                        onChange={handleChange}
                    />
                )
            )}
        </View>
    );
}
