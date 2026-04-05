import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppSetting, AppSettingRequest } from '../models/app-setting.model';

@Injectable({
  providedIn: 'root'
})
export class AppSettingApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/settings`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppSetting[]> {
    return this.http.get<AppSetting[]>(this.BASE);
  }

  getByCategory(category: string): Observable<AppSetting[]> {
    return this.http.get<AppSetting[]>(`${this.BASE}/category/${category}`);
  }

  getByKey(key: string): Observable<AppSetting> {
    return this.http.get<AppSetting>(`${this.BASE}/${key}`);
  }

  upsert(dto: AppSettingRequest): Observable<AppSetting> {
    return this.http.post<AppSetting>(this.BASE, dto);
  }

  delete(key: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${key}`);
  }
}
