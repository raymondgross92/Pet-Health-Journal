import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../db';
import { Alert } from 'react-native';

export async function exportData() {
    try {
        const db = await getDb();

        // Fetch all data
        const pets = await db.getAllAsync('SELECT * FROM pets');
        const logs = await db.getAllAsync('SELECT * FROM logs');
        const medications = await db.getAllAsync('SELECT * FROM medications');
        const medication_times = await db.getAllAsync('SELECT * FROM medication_times'); // Legacy/Existing
        const documents = await db.getAllAsync('SELECT * FROM documents');
        const routines = await db.getAllAsync('SELECT * FROM routines');
        const routine_times = await db.getAllAsync('SELECT * FROM routine_times');
        const vets = await db.getAllAsync('SELECT * FROM vets');
        const expenses = await db.getAllAsync('SELECT * FROM expenses');
        const vaccinations = await db.getAllAsync('SELECT * FROM vaccinations');
        const appointments = await db.getAllAsync('SELECT * FROM appointments');
        const symptoms = await db.getAllAsync('SELECT * FROM symptoms');

        // New Tables
        const foods = await db.getAllAsync('SELECT * FROM foods');
        const food_logs = await db.getAllAsync('SELECT * FROM food_logs');

        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                pets,
                logs,
                medications,
                medication_times,
                documents,
                routines,
                routine_times,
                vets,
                expenses,
                vaccinations,
                appointments,
                symptoms,
                foods,
                food_logs
            }
        };

        const fileUri = FileSystem.documentDirectory + 'pet_health_backup.json';
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert("Info", "Teilen ist auf diesem Gerät nicht verfügbar.");
        }

    } catch (e) {
        console.error(e);
        Alert.alert("Fehler", "Backup fehlgeschlagen.");
    }
}

export async function importData() {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const content = await FileSystem.readAsStringAsync(asset.uri);
        const backup = JSON.parse(content);

        if (!backup.data || !backup.version) {
            Alert.alert("Fehler", "Ungültige Backup-Datei.");
            return;
        }

        Alert.alert(
            "Wiederherstellen",
            "ACHTUNG: Alle aktuellen Daten werden gelöscht und durch das Backup ersetzt via Import. Fortfahren?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Importieren",
                    style: "destructive",
                    onPress: async () => {
                        await performRestore(backup.data);
                    }
                }
            ]
        );

    } catch (e) {
        console.error(e);
        Alert.alert("Fehler", "Import fehlgeschlagen.");
    }
}

async function performRestore(data: any) {
    try {
        const db = await getDb();

        // 1. Clear Database
        // Order matters due to Foreign Keys: child tables first
        const tables = [
            'food_logs', 'symptoms', 'appointments', 'vaccinations', 'expenses',
            'routine_times', 'medication_times', 'documents',
            'foods', 'medications', 'logs', 'routines', 'vets', 'pets'
        ];

        for (const table of tables) {
            await db.runAsync(`DELETE FROM ${table}`);
            await db.runAsync(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
        }

        // 2. Insert Data

        // Pets
        for (const p of data.pets || []) {
            await db.runAsync(
                `INSERT INTO pets (id, name, breed, date_of_birth, weight, image_uri, species, target_weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [p.id, p.name, p.breed, p.date_of_birth, p.weight, p.image_uri, p.species, p.target_weight]
            );
        }

        // Vets
        for (const v of data.vets || []) {
            await db.runAsync(
                `INSERT INTO vets (id, name, phone, address, emergency, notes) VALUES (?, ?, ?, ?, ?, ?)`,
                [v.id, v.name, v.phone, v.address, v.emergency, v.notes]
            );
        }

        // Medications
        for (const m of data.medications || []) {
            await db.runAsync(
                `INSERT INTO medications (id, pet_id, name, dosage, frequency, stock, notes, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [m.id, m.pet_id, m.name, m.dosage, m.frequency, m.stock, m.notes, m.min_stock]
            );
        }

        // Foods (New)
        for (const f of data.foods || []) {
            await db.runAsync(
                `INSERT INTO foods (id, name, brand, type, calories_per_100g, ingredients, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [f.id, f.name, f.brand, f.type, f.calories_per_100g, f.ingredients, f.notes]
            );
        }

        // Logs
        for (const l of data.logs || []) {
            await db.runAsync(
                `INSERT INTO logs (id, pet_id, vet_id, title, description, date, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [l.id, l.pet_id, l.vet_id, l.title, l.description, l.date, l.type]
            );
        }

        // Documents
        for (const d of data.documents || []) {
            await db.runAsync(
                `INSERT INTO documents (id, pet_id, title, uri, type, date) VALUES (?, ?, ?, ?, ?, ?)`,
                [d.id, d.pet_id, d.title, d.uri, d.type, d.date]
            );
        }

        // Routines
        for (const r of data.routines || []) {
            // Check if column medication_id exists in backup, else null
            const medId = r.medication_id || null;
            await db.runAsync(
                `INSERT INTO routines (id, pet_id, title, type, frequency, enabled, medication_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [r.id, r.pet_id, r.title, r.type, r.frequency, r.enabled, medId]
            );
        }

        // Routine Times (Many-to-One with Routines)
        for (const rt of data.routine_times || []) {
            await db.runAsync(
                `INSERT INTO routine_times (id, routine_id, time) VALUES (?, ?, ?)`,
                [rt.id, rt.routine_id, rt.time]
            );
        }

        // Medication Times (Legacy?)
        for (const mt of data.medication_times || []) {
            await db.runAsync(
                `INSERT INTO medication_times (id, medication_id, time) VALUES (?, ?, ?)`,
                [mt.id, mt.medication_id, mt.time]
            );
        }

        // Expenses
        for (const ex of data.expenses || []) {
            await db.runAsync(
                `INSERT INTO expenses (id, pet_id, title, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [ex.id, ex.pet_id, ex.title, ex.amount, ex.date, ex.category, ex.notes]
            );
        }

        // Vaccinations
        for (const v of data.vaccinations || []) {
            await db.runAsync(
                `INSERT INTO vaccinations (id, pet_id, name, date, next_due, notes, document_uri) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [v.id, v.pet_id, v.name, v.date, v.next_due, v.notes, v.document_uri]
            );
        }

        // Appointments
        for (const a of data.appointments || []) {
            await db.runAsync(
                `INSERT INTO appointments (id, pet_id, vet_id, title, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [a.id, a.pet_id, a.vet_id, a.title, a.date, a.time, a.notes]
            );
        }

        // Symptoms
        for (const s of data.symptoms || []) {
            await db.runAsync(
                `INSERT INTO symptoms (id, pet_id, title, severity, date, time, notes, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [s.id, s.pet_id, s.title, s.severity, s.date, s.time, s.notes, s.image_uri]
            );
        }

        // Food Logs (New)
        for (const fl of data.food_logs || []) {
            await db.runAsync(
                `INSERT INTO food_logs (id, pet_id, food_id, amount_grams, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [fl.id, fl.pet_id, fl.food_id, fl.amount_grams, fl.date, fl.time, fl.notes]
            );
        }

        Alert.alert("Erfolg", "Backup erfolgreich wiederhergestellt! Bitte App neu starten.");

    } catch (e) {
        console.error(e);
        Alert.alert("Fehler", "Daten konnten nicht in die Datenbank geschrieben werden: " + (e as Error).message);
    }
}
