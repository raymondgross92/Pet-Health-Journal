import { openDatabase } from './database';
import { Weight } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class WeightRepository {

    static async addWeight(weight: Omit<Weight, 'id'>): Promise<Weight> {
        const db = await openDatabase();
        const newWeight: Weight = {
            id: uuidv4(),
            ...weight
        };

        await db.runAsync(
            `INSERT INTO weights (id, pet_id, value_kg, date, note)
       VALUES (?, ?, ?, ?, ?)`,
            [
                newWeight.id,
                newWeight.pet_id,
                newWeight.value_kg,
                newWeight.date,
                newWeight.note ?? null
            ]
        );

        return newWeight;
    }

    static async getWeightsForPet(petId: string): Promise<Weight[]> {
        const db = await openDatabase();
        // Order by date DESC to show newest first
        const weights = await db.getAllAsync<Weight>(
            'SELECT * FROM weights WHERE pet_id = ? ORDER BY date DESC',
            [petId]
        );
        return weights;
    }

    static async deleteWeight(id: string): Promise<void> {
        const db = await openDatabase();
        await db.runAsync('DELETE FROM weights WHERE id = ?', [id]);
    }
}
