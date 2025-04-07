import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Profil } from "../../models/profil.model";
import { AccountStatus, VerificationStatus } from "./accountstatus.enum";
@Injectable({
    providedIn: 'root'
})
export class ClientService{
     url = environment.apiUrl+'/api/v1/client';
    constructor(private http: HttpClient) { }
    // Get all clients
    getClients(): Observable<Profil[]> {
        return this.http.get<Profil[]>(this.url+'/list');
    }
    validate(clientId: string,status: VerificationStatus): Observable<any> {
        return this.http.put(this.url+'/validateKyc?clientId='+clientId+'&status='+status, {});
    }
    activateAccount(clientId: string,status: AccountStatus): Observable<any> {
        return this.http.put(this.url+'/activateAccount?clientId='+clientId+'&status='+status, {});
    }
}