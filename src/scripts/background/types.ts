export interface DatabaseEntry {
    id: string;
    url: string;
    rating: string;
}

export interface Service {
    id: string;
    rating: string;
}

export interface DonationReminderState {
    active?: boolean;
    allowedPlattform?: boolean;
}
