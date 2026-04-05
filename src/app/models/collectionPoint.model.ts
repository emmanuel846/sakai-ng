export type CollectionPointType = 'INDIVIDUAL' | 'COMPANY' | 'OFFICIAL_POINT';
export type CollectionPointStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface OpeningHoursEntry {
    day: DayOfWeek;
    openTime?: string;   // "HH:mm"
    closeTime?: string;  // "HH:mm"
    closed: boolean;
}

export interface CollectionPoint {
    id?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    deleted?: boolean;

    type: CollectionPointType;
    name: string;
    locationUrl?: string;
    address: string;
    contacts?: string;
    openHours?: string;
    openingHours?: OpeningHoursEntry[];
    status?: CollectionPointStatus;

    // Localisation (noms resolus côté API)
    countryName?: string;
    cityName?: string;
    provinceName?: string;

    // Particulier (INDIVIDUAL)
    email?: string;
    firstName?: string;
    lastName?: string;

    // Entreprise / Point officiel (COMPANY, OFFICIAL_POINT)
    companyName?: string;
    registrationNumber?: string;
    website?: string;
}

export interface CollectionPointCreateRequest {
    type: CollectionPointType;
    name: string;
    locationUrl?: string;
    address: string;
    contacts?: string;
    openHours?: string;
    openingHours?: OpeningHoursEntry[];

    // Localisation (IDs)
    countryId?: string;
    cityId?: string;
    provinceId?: string;

    // Particulier
    email?: string;
    firstName?: string;
    lastName?: string;

    // Entreprise / Point officiel
    companyName?: string;
    registrationNumber?: string;
    website?: string;
}

export type CollectionPointUpdateRequest = Partial<CollectionPointCreateRequest>;

// Alias pour la compatibilité
export interface CollectionPointLists extends CollectionPoint {}