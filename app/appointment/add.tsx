import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { getDb } from '../../db';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import DateTimePickerInput from '../../components/ui/DateTimePickerInput';
import { Pet } from '../../types';
import * as Notifications from 'expo-notifications';
import { CalendarService } from '../../services/CalendarService';

export default function AddAppointmentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const preSelectedPetId = params.petId ? Number(params.petId) : null;

    const [pets, setPets] = useState<Pet[]>([]);
    const [vets, setVets] = useState<any[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(preSelectedPetId);
    const [selectedVetId, setSelectedVetId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [appointmentType, setAppointmentType] = useState<'general' | 'vet'>('general');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date()); // For time picking
    const [addToCalendar, setAddToCalendar] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const db = await getDb();
        const petsResult = await db.getAllAsync<Pet>('SELECT * FROM pets');
        setPets(petsResult);

        if (!selectedPetId && petsResult.length > 0) {
            setSelectedPetId(petsResult[0].id);
        }

        const vetsResult = await db.getAllAsync<any>('SELECT * FROM vets');
        setVets(vetsResult || []);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Fehler', 'Bitte gib einen Grund/Titel an.');
            return;
        }
        if (!selectedPetId) {
            Alert.alert('Fehler', 'Bitte wähle ein Haustier.');
            return;
        }
        if (appointmentType === 'vet' && !selectedVetId) {
            Alert.alert('Fehler', 'Bitte wähle einen Tierarzt aus.');
            return;
        }

        setLoading(true);
        try {
            const db = await getDb();
            const formattedDate = date.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const formattedTime = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            // Insert
            const result = await db.runAsync(
                'INSERT INTO appointments (pet_id, vet_id, title, date, time, notes) VALUES (?, ?, ?, ?, ?, ?)',
                selectedPetId, selectedVetId, title, formattedDate, formattedTime, notes
            );

            // Schedule Notification (1 day before + 1 hour before)
            // Combine date & time
            const triggerDate = new Date(date);
            triggerDate.setHours(time.getHours(), time.getMinutes(), 0, 0);

            // Notification: 2 Hours before
            const notifyTime = new Date(triggerDate.getTime() - 2 * 60 * 60 * 1000);
            if (notifyTime > new Date()) {
                const petName = pets.find(p => p.id === selectedPetId)?.name || 'Haustier';
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `Tierarzt-Termin: ${petName}`,
                        body: `${title} um ${formattedTime} Uhr`,
                        data: { appointmentId: result.lastInsertRowId },
                    },
                    trigger: notifyTime as any,
                });
            }

            // Calendar
            if (addToCalendar) {
                const petName = pets.find(p => p.id === selectedPetId)?.name || '';
                const vet = vets.find(v => v.id === selectedVetId);
                const location = vet ? (vet.address || vet.name) : 'Tierarzt';

                // End time + 1h
                const endDate = new Date(triggerDate.getTime() + 60 * 60 * 1000);

                await CalendarService.createEvent({
                    title: `Tierarzt: ${petName} - ${title}`,
                    startDate: triggerDate,
                    endDate: endDate,
                    location: location,
                    notes: notes
                });
            }

            router.back();

        } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Konnte Termin nicht speichern.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-secondary-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-secondary-900">Neuer Termin</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-6">

                {/* Pet Selection */}
                <Text className="text-secondary-700 font-medium mb-3 ml-1">Für wen?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {pets.map(pet => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPetId(pet.id)}
                            className={`mr-3 items-center ${selectedPetId === pet.id ? 'opacity-100' : 'opacity-50'}`}
                        >
                            <View className={`h-16 w-16 rounded-full overflow-hidden border-2 ${selectedPetId === pet.id ? 'border-primary-500' : 'border-transparent'}`}>
                                <Image source={pet.image_uri ? { uri: pet.image_uri } : { uri: 'https://placehold.co/100' }} className="h-full w-full" />
                            </View>
                            <Text className={`text-xs mt-1 font-bold ${selectedPetId === pet.id ? 'text-primary-600' : 'text-secondary-500'}`}>{pet.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Input
                    label="Grund / Titel"
                    placeholder="z.B. Impfung, Jahrescheck"
                    value={title}
                    onChangeText={setTitle}
                />

                {/* Type Selection */}
                <Text style={{
                    color: '#334155', // secondary-700
                    fontWeight: '500',
                    marginBottom: 12,
                    marginLeft: 4
                }}>Art des Termins</Text>
                <View style={{
                    flexDirection: 'row',
                    marginBottom: 24,
                    backgroundColor: '#f1f5f9', // secondary-100
                    padding: 4,
                    borderRadius: 12
                }}>
                    <TouchableOpacity
                        onPress={() => setAppointmentType('general')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            backgroundColor: appointmentType === 'general' ? 'white' : 'transparent',
                            shadowOpacity: appointmentType === 'general' ? 0.05 : 0,
                            shadowRadius: 2,
                            shadowOffset: { width: 0, height: 1 },
                            elevation: appointmentType === 'general' ? 1 : 0,
                        }}
                    >
                        <Text style={{
                            fontWeight: 'bold',
                            color: appointmentType === 'general' ? '#0f172a' : '#64748b' // secondary-900 : secondary-500
                        }}>Allgemein</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setAppointmentType('vet')}
                        style={{
                            flex: 1,
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            backgroundColor: appointmentType === 'vet' ? 'white' : 'transparent',
                            shadowOpacity: appointmentType === 'vet' ? 0.05 : 0,
                            shadowRadius: 2,
                            shadowOffset: { width: 0, height: 1 },
                            elevation: appointmentType === 'vet' ? 1 : 0,
                        }}
                    >
                        <Text style={{
                            fontWeight: 'bold',
                            color: appointmentType === 'vet' ? '#4f46e5' : '#64748b' // indigo-600 : secondary-500
                        }}>Tierarzt</Text>
                    </TouchableOpacity>
                </View>

                {/* Vet Selection - Only if Type is Vet */}
                {/* Vet Selection - Only if Type is Vet */}
                {appointmentType === 'vet' && (
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{
                            color: '#334155', // secondary-700
                            fontWeight: '500',
                            marginBottom: 8,
                            marginLeft: 4
                        }}>Welcher Tierarzt?</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                            {vets && vets.length > 0 ? (
                                vets.map(vet => (
                                    <TouchableOpacity
                                        key={vet.id}
                                        onPress={() => setSelectedVetId(vet.id)}
                                        style={{
                                            marginRight: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: selectedVetId === vet.id ? '#4f46e5' : '#e2e8f0', // indigo-600 : secondary-200
                                            backgroundColor: selectedVetId === vet.id ? '#4f46e5' : 'white',
                                        }}
                                    >
                                        <Text style={{
                                            fontWeight: 'bold',
                                            color: selectedVetId === vet.id ? 'white' : '#334155' // slate-700
                                        }}>{vet.name || 'Unbekannt'}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginRight: 12, alignSelf: 'center' }}>Keine Tierärzte gefunden.</Text>
                            )}
                            <TouchableOpacity
                                onPress={() => router.push('/add-vet')}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#cbd5e1', // secondary-300
                                    borderStyle: 'dashed',
                                    backgroundColor: '#f8fafc', // secondary-50
                                    justifyContent: 'center'
                                }}
                            >
                                <Text style={{ color: '#64748b', fontWeight: 'bold' }}>+ Neu</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                <View className="flex-row space-x-4 mb-2">
                    <View className="flex-1">
                        <DateTimePickerInput
                            label="Datum"
                            value={date}
                            onChange={setDate}
                        />
                    </View>
                    <View className="flex-1">
                        <DateTimePickerInput
                            label="Uhrzeit"
                            mode="time"
                            value={time}
                            onChange={setTime}
                        />
                    </View>
                </View>

                <Input
                    label="Notizen"
                    placeholder="Zusätzliche Infos..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    className="h-24"
                    textAlignVertical="top"
                />

                <View className="flex-row items-center justify-between bg-secondary-50 p-4 rounded-xl mb-8">
                    <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={24} color="#6366f1" />
                        <View className="ml-3">
                            <Text className="text-secondary-900 font-bold">In Kalender eintragen</Text>
                            <Text className="text-secondary-500 text-xs">Exportiert in deinen System-Kalender</Text>
                        </View>
                    </View>
                    <Switch
                        value={addToCalendar}
                        onValueChange={setAddToCalendar}
                        trackColor={{ true: '#8b5cf6' }}
                    />
                </View>

                <Button
                    label={loading ? "Speichert..." : "Termin speichern"}
                    onPress={handleSave}
                    disabled={loading}
                />
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
