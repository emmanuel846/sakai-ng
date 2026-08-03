import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActivateAccountRequest,
  AddRoleRequest,
  CreateAdminUserRequest,
  CreateRoleRequest,
  CreateUserRequest,
  Role,
  User
} from '../models/user.model';
import { AuthResponse } from '../models/authRegister.model';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly AUTH_BASE = `${environment.apiUrl}/api`;
  private readonly ROLES_BASE = `${environment.apiUrl}/api/v1/roles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.AUTH_BASE}/users`);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.AUTH_BASE}/user/${id}`);
  }

  create(dto: CreateUserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.AUTH_BASE}/auth/register`, dto);
  }

  createAdmin(dto: CreateAdminUserRequest): Observable<User> {
    return this.http.post<User>(`${this.AUTH_BASE}/admin/users`, dto);
  }

  activateAccount(dto: ActivateAccountRequest): Observable<User> {
    return this.http.put<User>(`${this.AUTH_BASE}/admin/activateAccount`, dto);
  }

  addRoles(dto: AddRoleRequest): Observable<{ message?: string; error?: string }> {
    return this.http.post<{ message?: string; error?: string }>(`${this.AUTH_BASE}/user/addRole`, dto);
  }

  removeRoles(dto: AddRoleRequest): Observable<{ message?: string; error?: string }> {
    return this.http.post<{ message?: string; error?: string }>(`${this.AUTH_BASE}/user/removeRole`, dto);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.ROLES_BASE);
  }

  createRole(dto: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>(this.ROLES_BASE, dto);
  }
}
