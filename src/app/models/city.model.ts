export interface City {
  id?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  name: string;
  country?: Country | string;
}

export interface Country {
  id?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  iso2: string;
  iso3: string;
  name: string;
  status?: string;
}

export interface CityCreateRequest {
  country: string;
  cities: string[];
}

export interface CityByCountryRequest {
  country: string;
}

export interface CountryCreateRequest {
  iso2: string;
  iso3: string;
  name: string;
}

export interface CountryListCreateRequest extends Array<CountryCreateRequest> {}