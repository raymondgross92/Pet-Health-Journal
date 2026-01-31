import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../context/ThemeContext';
import { getDb } from '../../db';
import Button from '../../components/ui/Button';

export default function AddVaccinationScreen() {
    const { petId } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();

    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('de-DE'));
    const [nextDue, setNextDue] = useState('');
    const [notes, setNotes] = useState('');
    const [documentUri, setDocumentUri] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setDocumentUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !date) {
            Alert.alert("Fehler", "Name und Datum sind Pflichtfelder.");
            return;
        }

        try {
            const db = await getDb();
            await db.runAsync(
                'INSERT INTO vaccinations (pet_id, name, date, next_due, notes, document_uri) VALUES (?, ?, ?, ?, ?, ?)',
                [Number(petId), name, date, nextDue, notes, documentUri]
            );

            // Schedule Notification if Next Due is set
            if (nextDue) {
                const parts = nextDue.split('.');
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                    const year = parseInt(parts[2]);

                    const dueDate = new Date(year, month, day);
                    dueDate.setHours(9, 0, 0, 0); // Reminder at 09:00

                    // Only schedule if date is in future
                    if (dueDate > new Date()) {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: `Impferinnerung: ${name}`,
                                body: `Die Impfung ${name} ist fällig!`,
                                sound: true,
                            },
                            trigger: dueDate as any,
                        });
                    }
                }
            }

            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Konnte nicht speichern.");
        }
    };

    return (
        <SafeAreaView className={`flex - 1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'} `}>
            <View className={`px - 5 py - 4 border - b flex - row justify - between items - center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'} `}>
                <TouchableOpacity onPress={() => router.back()} className={`p - 2 rounded - full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} `}>
                    <Ionicons name="close" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text - xl font - bold font - sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'} `}>Impfung hinzufügen</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 p-5">
                <Text className={`text - sm font - bold uppercase mb - 2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'} `}>Impfung / Medikament</Text>
                <TextInput
                    className={`p - 4 rounded - xl mb - 6 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'} `}
                    placeholder="z.B. Tollwut, SHPPi..."
                    placeholderTextColor={theme === 'dark' ? '#64748b' : '#94a3b8'}
                    value={name}
                    onChangeText={setName}
                />

                <Text className={`text - sm font - bold uppercase mb - 2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'} `}>Datum der Impfung</Text>
                <TextInput
                    className={`p - 4 rounded - xl mb - 6 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'} `}
                    value={date}
                    onChangeText={setDate}
                    placeholder="TT.MM.JJJJ"
                />

                <Text className={`text - sm font - bold uppercase mb - 2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'} `}>Nächste Fälligkeit (Optional)</Text>
                <TextInput
                    className={`p - 4 rounded - xl mb - 6 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-secondary-900'} `}
                    value={nextDue}
                    onChangeText={setNextDue}
                    placeholder="TT.MM.JJJJ"
                />

                {/* Document Picker */}
                <Text className={`text - sm font - bold uppercase mb - 2 ${theme === 'dark' ? 'text-slate-400' : 'text-secondary-500'} `}>Foto / Zertifikat</Text>
                <TouchableOpacity
                    onPress={pickImage}
                    className={`h - 40 rounded - xl mb - 6 items - center justify - center border - 2 border - dashed ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-secondary-200 bg-white'} `}
                >
                    {documentUri ? (
                        <Image source={{ uri: documentUri }} className="w-full h-full rounded-xl" resizeMode="contain" />
                    ) : (
                        <>
                            <Ionicons name="camera" size={32} color={theme === 'dark' ? '#64748b' : '#cbd5e1'} />
                            <Text className={`mt - 2 ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'} `}>Foto hochladen</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Button label="Speichern" onPress={handleSave} size="lg" />
            </ScrollView>
        </SafeAreaView>
    );
}
