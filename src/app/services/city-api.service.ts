import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { City, CityCreateRequest, CityByCountryRequest } from '../models/city.model';

@Injectable({
  providedIn: 'root'
})
export class CityApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de toutes les villes
   */
  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/api/v1/cities/list`);
  }

  /**
   * Récupère les villes d'un pays spécifique
   */
  getCitiesByCountry(countryName: string): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/api/v1/cities/listByCountry?country=${countryName}`);
  }

  /**
   * Crée des villes pour un pays
   */
  createCities(cityRequest: CityCreateRequest): Observable<City[]> {
    return this.http.post<City[]>(`${this.baseUrl}/api/v1/cities/create`, cityRequest);
  }

  /**
   * Met à jour une ville
   */
  updateCity(id: string, city: Partial<City>): Observable<City> {
    return this.http.put<City>(`${this.baseUrl}/api/v1/cities/${id}`, city);
  }

  /**
   * Supprime une ville
   */
  deleteCity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/cities/${id}`);
  }
}
