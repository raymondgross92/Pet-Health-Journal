import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getDb } from '../../../db';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import EmptyState from '../../../components/ui/EmptyState';

export default function PetPassportScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { theme } = useTheme();
    const [pages, setPages] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Convert id to number safely
    const petId = Number(id);

    const loadData = async () => {
        try {
            const db = await getDb();
            const result = await db.getAllAsync<any>(
                "SELECT * FROM documents WHERE pet_id = ? AND type = 'passport' ORDER BY id DESC",
                petId
            );
            setPages(result);
        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Pass-Daten konnten nicht geladen werden.");
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
                type: ['image/*', 'application/pdf']
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            // @ts-ignore
            const savedUri = (FileSystem.documentDirectory || '') + 'passport_' + Date.now() + '_' + (asset.name || 'doc');

            await FileSystem.copyAsync({
                from: asset.uri,
                to: savedUri
            });

            const db = await getDb();
            await db.runAsync(
                'INSERT INTO documents (pet_id, title, uri, type, date) VALUES (?, ?, ?, ?, ?)',
                [petId, asset.name || 'Pass Seite', savedUri, 'passport', new Date().toLocaleDateString('de-DE')]
            );
            loadData();

        } catch (e) {
            console.error(e);
            Alert.alert("Fehler", "Dokument konnte nicht geladen werden.");
        }
    };

    const handleDelete = (docId: number) => {
        Alert.alert(
            "Löschen",
            "Seite wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDb();
                        await db.runAsync('DELETE FROM documents WHERE id = ?', [docId]);
                        loadData();
                        if (selectedImage) setSelectedImage(null);
                    }
                }
            ]
        );
    };

    const openDocument = async (uri: string, mimeType: string) => {
        // If it's an image, show in modal, otherwise share/open
        if (mimeType && mimeType.includes('pdf')) {
            try {
                await Sharing.shareAsync(uri);
            } catch (e) {
                Alert.alert("Info", "Dokument kann nicht geöffnet werden.");
            }
        } else {
            setSelectedImage(uri);
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-slate-950' : 'bg-secondary-50'}`}>
            <View className={`px-5 py-4 border-b flex-row justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-secondary-100'}`}>
                <TouchableOpacity onPress={() => router.back()} className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                    <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>Heimtierausweis</Text>
                <TouchableOpacity
                    onPress={pickDocument}
                    className={`p-2 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}
                >
                    <Ionicons name="add" size={24} color={theme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
                {pages.length === 0 ? (
                    <EmptyState
                        icon="book"
                        title="Kein Ausweis vorhanden"
                        description="Lade Fotos oder Scans des Heimtierausweises hoch."
                        actionLabel="Seite hinzufügen"
                        onAction={pickDocument}
                    />
                ) : (
                    <View className="flex-row flex-wrap justify-between">
                        {pages.map((page) => (
                            <TouchableOpacity
                                key={page.id}
                                onPress={() => openDocument(page.uri, page.mimeType)} // mimeType might be needed in DB if not present, but using rudimentary check
                                onLongPress={() => handleDelete(page.id)}
                                className={`w-[48%] mb-4 rounded-xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-secondary-100'}`}
                            >
                                <View className="h-40 bg-gray-200 items-center justify-center">
                                    {page.uri.endsWith('.pdf') ? (
                                        <Ionicons name="document-text" size={48} color="#64748b" />
                                    ) : (
                                        <Image source={{ uri: page.uri }} className="w-full h-full" resizeMode="cover" />
                                    )}
                                </View>
                                <View className="p-3">
                                    <Text numberOfLines={1} className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-secondary-900'}`}>{page.title}</Text>
                                    <Text className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-secondary-400'}`}>{page.date}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View className="flex-1 bg-black/90 justify-center items-center relative">
                    <TouchableOpacity
                        onPress={() => setSelectedImage(null)}
                        className="absolute top-12 right-6 z-10 p-2 bg-black/50 rounded-full"
                    >
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}
