import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Profil } from "../../models/profil.model";
import { AccountStatus, VerificationStatus } from "./accountstatus.enum";

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    url = environment.apiUrl + '/api/v1/client';
    private globalUrl = environment.apiUrl + '/api/global';

    constructor(private http: HttpClient) { }

    getClients(): Observable<Profil[]> {
        return this.http.get<Profil[]>(this.url + '/list');
    }

    getClientById(clientId: string): Observable<Profil> {
        return this.http.get<Profil>(this.url + '/clientById?clientId=' + clientId);
    }

    validate(clientId: string, status: VerificationStatus): Observable<any> {
        return this.http.put(this.url + '/validateKyc?clientId=' + clientId + '&status=' + status, {});
    }

    activateAccount(clientId: string, status: AccountStatus): Observable<any> {
        return this.http.put(this.url + '/activateAccount?clientId=' + clientId + '&status=' + status, {});
    }

    downloadFile(fileName: string): Observable<Blob> {
        return this.http.get(this.globalUrl + '/downloadFile', {
            params: { fileName },
            responseType: 'blob'
        });
    }
}
