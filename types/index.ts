export interface Pet {
    id: number;
    name: string;
    breed: string;
    date_of_birth: string;
    weight: number;
    image_uri?: string;
    species?: string;
    target_weight?: number;
}

export interface Log {
    id: number;
    title: string;
    description: string;
    date: string;
    type: string;
    pet_id: number;
    vet_id?: number | null;
}

export interface ReminderLog extends Log {
    pet_name?: string;
}

export interface Expense {
    id: number;
    pet_id?: number;
    title: string;
    amount: number;
    date: string;
    category: 'Food' | 'Vet' | 'Toys' | 'Insurance' | 'Other';
    notes?: string;
}

export interface Vaccination {
    id: number;
    pet_id: number;
    name: string;
    date: string;
    next_due?: string;
    notes?: string;
    document_uri?: string;
}
