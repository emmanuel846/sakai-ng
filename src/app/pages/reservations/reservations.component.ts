import { Component, computed } from '@angular/core';
import { ReservationService } from './reservations.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
interface Column {
  field: string;
  header: string;
  type?: 'date' | 'number' | 'string' | 'boolean';
}
@Component({
  selector: 'app-reservations',
  imports: [TableModule, CommonModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent {
  reservations = computed(() => this.reservationService.reservations());
    cols!: Column[];

  constructor(private reservationService: ReservationService){
    this.reservationService.reservationsList().subscribe({});

    this.cols = [
      { field: 'id', header: 'Référence' },
      { field: 'createdAt', header: 'Date de création', type: 'date' },
      { field: 'amount', header: 'Montant' },
      { field: 'totalWeight', header: 'Poids total' },
      { field: 'status', header: 'Statut' },
    
      // Champs imbriqués
      { field: 'receiver.fullName', header: 'Récepteur' },
      { field: 'receiver.phoneNumber', header: 'Téléphone récepteur' },
    
      { field: 'clients.firstname', header: 'Client' },
      { field: 'clients.phoneNumber', header: 'Téléphone client' },
    
      { field: 'expeditions.countryDep', header: 'Pays de départ' },
      { field: 'expeditions.countryArr', header: 'Pays d\'arrivée' },
      { field: 'expeditions.depDateStart', header: 'Date départ prévue', type: 'date' },
      { field: 'expeditions.arrivalEndDate', header: 'Date d\'arrivée estimée', type: 'date' },
    
      { field: 'expeditions.collectionPoints.name', header: 'Point de collecte' },
    ];
    

  }
  resolveFieldData(data: any, field: string): any {
    if (!data || !field) return null;
    if (field.indexOf('.') === -1) {
      return data[field];
    } else {
      return field.split('.').reduce((obj, key) => (obj ? obj[key] : null), data);
    }
  }
  
}
