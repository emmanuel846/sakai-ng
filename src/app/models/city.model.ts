export interface City {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  name: string;
  country: Country;
}

export interface Country {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  iso2: string;
  iso3: string;
  name: string;
  status: string;
}