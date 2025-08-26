export interface CollectionPoint {
    id?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    deleted?: boolean;
    name: string;
    location_url?: string;
    google_location_url?: string;
    adresse: string;
    contacts: string;
    openHours: string;
    country: string;
    status?: string;
}

export interface CollectionPointCreateRequest {
    name: string;
    google_location_url: string;
    adresse: string;
    contacts: string;
    openHours: string;
    country: string;
}

// Alias pour la compatibilité
export interface CollectionPointLists extends CollectionPoint {}