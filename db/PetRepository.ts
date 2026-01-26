import { openDatabase } from './database';
import { Pet } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PetRepository {

    static async addPet(pet: Omit<Pet, 'id' | 'created_at'>): Promise<Pet> {
        const db = await openDatabase();
        const newPet: Pet = {
            id: uuidv4(),
            ...pet,
            created_at: Math.floor(Date.now() / 1000),
        };

        await db.runAsync(
            `INSERT INTO pets (id, name, species, breed, birth_date, chip_number, image_uri, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newPet.id,
                newPet.name,
                newPet.species,
                newPet.breed ?? null,
                newPet.birth_date ?? null,
                newPet.chip_number ?? null,
                newPet.image_uri ?? null,
                newPet.created_at
            ]
        );

        return newPet;
    }

    static async getAllPets(): Promise<Pet[]> {
        const db = await openDatabase();
        const pets = await db.getAllAsync<Pet>('SELECT * FROM pets ORDER BY created_at DESC');
        return pets;
    }

    static async getPetById(id: string): Promise<Pet | null> {
        const db = await openDatabase();
        const pet = await db.getFirstAsync<Pet>('SELECT * FROM pets WHERE id = ?', [id]);
        return pet;
    }

    static async deletePet(id: string): Promise<void> {
        const db = await openDatabase();
        await db.runAsync('DELETE FROM pets WHERE id = ?', [id]);
    }
}
