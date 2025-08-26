import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { ClientsComponent } from './clients/clients.component';
import { ExpeditionsComponent } from './expeditions/expeditions.component';
import { ReservationsComponent } from './reservations/reservations.component';
import { ExpeditionMainComponent } from './expeditions/expedition-main/expedition-main.component';
import { CountryCityManagementComponent } from './country-city-management/country-city-management.component';
import { CollectionPointManagementComponent } from './collection-point-management/collection-point-management.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'clients', component: ClientsComponent },
    { path: 'expeditions', component: ExpeditionMainComponent },
    { path: 'reservations', component: ReservationsComponent },
    { path: 'country-city-management', component: CountryCityManagementComponent },
    { path: 'collection-point-management', component: CollectionPointManagementComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
