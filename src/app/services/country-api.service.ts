import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Country, CountryCreateRequest, CountryListCreateRequest } from '../models/city.model';

@Injectable({
  providedIn: 'root'
})
export class CountryApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de tous les pays
   */
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.baseUrl}/api/v1/countries/list`);
  }

  /**
   * Crée un nouveau pays
   */
  createCountry(country: CountryCreateRequest): Observable<Country> {
    return this.http.post<Country>(`${this.baseUrl}/api/v1/countries/create`, country);
  }

  /**
   * Crée plusieurs pays en une seule fois
   */
  createCountries(countries: CountryListCreateRequest): Observable<Country[]> {
    return this.http.post<Country[]>(`${this.baseUrl}/api/v1/countries/create/all`, countries);
  }

  /**
   * Met à jour un pays existant
   */
  updateCountry(id: string, country: CountryCreateRequest): Observable<Country> {
    return this.http.put<Country>(`${this.baseUrl}/api/v1/countries/${id}`, country);
  }

  /**
   * Supprime un pays
   */
  deleteCountry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/countries/${id}`);
  }
}
