import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, switchMap, tap, throwError } from 'rxjs';
import { AuthRegister, AuthResponse, AuthUserData, Register } from '../models/authRegister.model';
import { environment } from '../../environments/environment';
import { Expedition, ExpeditionLists, ListReservations, Reservation, SearchParams } from '../models/reservation.model';
import { Router } from '@angular/router';
import { Profil, updateProfile } from '../models/profil.model';
import { CollectionPointLists } from '../models/collectionPoint.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl+"/api";
  private isLoggedIn = false;
  
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user!: Profil;
  private isRefreshing = false;
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private fileStorage = new BehaviorSubject<string[] | null>(null);
  public redirectUrl:string|null = null;
  constructor(private http: HttpClient,private router: Router) { }

  // Set tokens after login
  setAuthToken(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem(environment.data.access_token, accessToken);
    localStorage.setItem(environment.data.refresh_token, refreshToken);
  }

  setUser(user: any): void {
    this.user = user;
    localStorage.setItem(environment.data.user_profile, JSON.stringify(user));
  }

  getUser():Profil{
    return JSON.parse(localStorage.getItem(environment.data.user_profile)!) as Profil; 
  }

  setFileStorage(media: string[]): void {
    this.fileStorage.next(media); // Met à jour la valeur
  }

  getFileStorage(): BehaviorSubject<string[] | null> {
    return this.fileStorage; // Retourne le BehaviorSubject
  }

  // Get access token
  getAuthToken(): string {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem(environment.data.access_token);
    }
    return this.accessToken || '';
  }

  // Get refresh token
  getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem(environment.data.refresh_token);
    }
    return this.refreshToken;
  }

  // Refresh access token
  refreshAccessToken() {
    // if (this.isRefreshing) {
    //   return this.tokenSubject.asObservable();
    // }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAuthToken();

    // if (!refreshToken) {
    //   return throwError(() => new Error('No refresh token available'));
    // }

    return this.http.post<any>(`${this.apiUrl}/auth/refresh-token`, { refreshToken,accessToken }).pipe(
      switchMap((response) => {
        const newAccessToken = response.accessToken;
        const newRefreshToken = response.refreshToken;

        this.setAuthToken(newAccessToken, newRefreshToken);
        this.tokenSubject.next(newAccessToken);
        this.isRefreshing = false;

        return this.tokenSubject.asObservable();
      }),
      catchError((error) => {
        console.log('error', error);
        
        this.isRefreshing = false;
        this.logout(); // Handle logout if refresh fails
        return throwError(() => error);
      })
    );
  }

  // Clear tokens on logout
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.isLoggedIn = false;
    localStorage.removeItem(environment.data.access_token);
    localStorage.removeItem(environment.data.refresh_token);
    localStorage.removeItem(environment.data.user_profile);
    this.router.navigate(['/auth/login']);
  }
  // Simule la connexion
  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    // Your login API call here
    this.isLoggedIn = true;
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials);
  }

  // Vérifie si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return this.isLoggedIn || localStorage.getItem(environment.data.access_token) !== null;
  }

  verifyEmail(): Observable<any> {
    return this.http.put(this.apiUrl + `/admin/verifyEmail`, {});
  }
  isEmailVerified(userId:number): Observable<{activated:boolean}> {
    return this.http.get<{activated:boolean}>(this.apiUrl + `/admin/isEmailActivated?userId=${userId}`);
  }

  emailActivation(): Observable<string> {
    return this.http.get<string>(this.apiUrl + `/public/emailActivation?token=${localStorage.getItem(environment.data.access_token)}`);
  }

  getUserById(id: number): Observable<AuthUserData> {  
    return this.http.get<AuthUserData>(this.apiUrl + `/user/${id}`);
  }
  getProfile(): Observable<Profil> {  
    return this.http.get<Profil>(this.apiUrl + '/api/v1/client/profile');
  }
  
  updateProfile(data: updateProfile): Observable<Profil> {  
    return this.http.put<Profil>(this.apiUrl + `/api/v1/client/profile/update`, data);
  }

  authRegisterUser(data: AuthRegister): Observable<AuthResponse> {
    
    return this.http.post<AuthResponse>(this.apiUrl + '/auth/register', data);
  }

  registerUser(data: Register): Observable<AuthResponse> {
    
    return this.http.post<AuthResponse>(this.apiUrl + '/api/v1/client/register', data);
  }
  isUserNameExist(username: string): Observable<{exist:boolean}> {
    return this.http.get<{exist:boolean}>(this.apiUrl + `/public/isUserNameAvailable?data=${username}`);
  }
  isEmailAvailable(email: string): Observable<{exist:boolean}> {
    return this.http.get<{exist:boolean}>(this.apiUrl + `/public/isEmailAvailable?data=${email}`);
  }
  forgotPassword(email: string): Observable<any> {
    return this.http.post(this.apiUrl + `/public/forgotPassword?email=${email}`, {});
  }

  verificationCode(email: string, authorizationCode: string): Observable<any> {
    return this.http.post(this.apiUrl + `/public/requestForPasswordInit?authorizationCode=${authorizationCode}&email=${email}`, {});
  }


  initializePassword(data:{password:string,confirmPassword:string,email:string,authorizationCode:string}): Observable<any> {
    return this.http.post(this.apiUrl + `/public/passwordInitialization`, data);
  }

 
}
