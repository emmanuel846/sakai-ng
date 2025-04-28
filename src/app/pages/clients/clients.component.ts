import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ClientService } from './client.service';
import { Profil } from '../../models/profil.model';
import { AccountStatus, VerificationStatus } from './accountstatus.enum';
import { Badge } from 'primeng/badge';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-clients',
  imports: [CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    Badge,
  ProgressBar],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients: Profil[] = [];
  selectedClient!: Profil;
  metaKey: boolean = true;
  loading = false;
  constructor(private clientService: ClientService) { }


  ngOnInit() {
    this.getAllClients();
  }
  getAllClients() {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.loading = false;
      },
      error:()=>{
        this.loading = false;
      }
    });
  }
  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  validateAccount() {
    this.clientService.validate(this.selectedClient.id, VerificationStatus.ACCEPTED).subscribe({
      next: (data) => {
        this.getAllClients();
      }
    });
  }
  activateAccount() {
    this.clientService.activateAccount(this.selectedClient.id, AccountStatus.ACTIVATED).subscribe({
      next: (data) => {
        this.getAllClients();
      }
    });
  }
  onRowSelect(event: any) {
    this.selectedClient = event.data;
  }
}