export interface Country {
  id?: string;
  iso2: string;
  iso3: string;
  name: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deleted?: boolean;
}

export interface CountryCreateRequest {
  iso2: string;
  iso3: string;
  name: string;
}

export interface CountryListCreateRequest extends Array<CountryCreateRequest> {}
