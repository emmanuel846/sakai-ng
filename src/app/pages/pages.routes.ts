import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { ClientsComponent } from './clients/clients.component';
import { ExpeditionsComponent } from './expeditions/expeditions.component';
import { ReservationsComponent } from './reservations/reservations.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'clients', component: ClientsComponent },
    { path: 'expeditions', component: ExpeditionsComponent },
    { path: 'reservations', component: ReservationsComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
