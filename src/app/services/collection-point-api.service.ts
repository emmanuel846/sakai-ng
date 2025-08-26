import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CollectionPoint, CollectionPointCreateRequest } from '../models/collectionPoint.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionPointApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste de tous les points de collecte
   */
  getCollectionPoints(): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.baseUrl}/api/v1/collectionpoints/list`);
  }

  /**
   * Crée un nouveau point de collecte
   */
  createCollectionPoint(collectionPoint: CollectionPointCreateRequest): Observable<CollectionPoint> {
    return this.http.post<CollectionPoint>(`${this.baseUrl}/api/v1/collectionpoints/create`, collectionPoint);
  }

  /**
   * Met à jour un point de collecte existant
   */
  updateCollectionPoint(id: string, collectionPoint: CollectionPointCreateRequest): Observable<CollectionPoint> {
    return this.http.put<CollectionPoint>(`${this.baseUrl}/api/v1/collectionpoints/${id}`, collectionPoint);
  }

  /**
   * Supprime un point de collecte
   */
  deleteCollectionPoint(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/collectionpoints/${id}`);
  }

  /**
   * Récupère les points de collecte d'un pays spécifique
   */
  getCollectionPointsByCountry(countryName: string): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.baseUrl}/api/v1/collectionpoints/listByCountry?country=${countryName}`);
  }
}
