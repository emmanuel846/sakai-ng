import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Table, TableModule, TableRowSelectEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Profil } from '../../models/profil.model';
import { AccountStatus, VerificationStatus } from './accountstatus.enum';
import { ClientService } from './client.service';

type KycFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NONE';

interface KycPreview {
  rectoUrl: string | null;
  versoUrl: string | null;
  selfieUrl: string | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-clients',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    ToolbarModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TagModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    DividerModule,
    TooltipModule,
    SelectButtonModule
  ],
  providers: [MessageService],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit, OnDestroy {
  clients: Profil[] = [];
  filteredClients: Profil[] = [];
  selectedClient: Profil | null = null;
  verificationStatus = VerificationStatus;
  loading = false;
  actionLoading = false;

  kycFilter: KycFilter = 'ALL';
  kycFilterOptions = [
    { label: 'Tous', value: 'ALL' },
    { label: 'En attente', value: 'PENDING' },
    { label: 'Acceptés', value: 'ACCEPTED' },
    { label: 'Rejetés', value: 'REJECTED' },
    { label: 'Sans KYC', value: 'NONE' }
  ];

  kycPreview: KycPreview = this.emptyPreview();
  private previewSub?: Subscription;
  private objectUrls: string[] = [];

  constructor(
    private clientService: ClientService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.getAllClients();
  }

  ngOnDestroy() {
    this.previewSub?.unsubscribe();
    this.revokeObjectUrls();
  }

  getAllClients() {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.clients = data ?? [];
        this.applyFilter();
        if (this.selectedClient) {
          const refreshed = this.clients.find((c) => c.id === this.selectedClient!.id) ?? null;
          this.selectedClient = refreshed;
          if (refreshed) {
            this.loadKycPreviews(refreshed);
          } else {
            this.clearSelection();
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les clients'
        });
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onKycFilterChange() {
    this.applyFilter();
  }

  applyFilter() {
    switch (this.kycFilter) {
      case 'PENDING':
        this.filteredClients = this.clients.filter((c) => c.verificationStatus === 'PENDING');
        break;
      case 'ACCEPTED':
        this.filteredClients = this.clients.filter((c) => c.verificationStatus === 'ACCEPTED');
        break;
      case 'REJECTED':
        this.filteredClients = this.clients.filter((c) => c.verificationStatus === 'REJECTED');
        break;
      case 'NONE':
        this.filteredClients = this.clients.filter(
          (c) => !c.verificationStatus || (!c.kycFileName && !c.kycSelfieFileName)
        );
        break;
      default:
        this.filteredClients = [...this.clients];
    }
  }

  onRowSelect(event: TableRowSelectEvent) {
    const client = event.data as Profil | undefined;
    if (!client) {
      return;
    }
    this.selectedClient = client;
    this.loadKycPreviews(client);
  }

  onRowUnselect() {
    this.clearSelection();
  }

  clearSelection() {
    this.selectedClient = null;
    this.previewSub?.unsubscribe();
    this.revokeObjectUrls();
    this.kycPreview = this.emptyPreview();
  }

  validateAccount(status: VerificationStatus) {
    if (!this.selectedClient) {
      return;
    }
    this.actionLoading = true;
    this.clientService.validate(this.selectedClient.id, status).subscribe({
      next: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: status === VerificationStatus.ACCEPTED ? 'success' : 'warn',
          summary: status === VerificationStatus.ACCEPTED ? 'KYC accepté' : 'KYC rejeté',
          detail: `${this.selectedClient!.lastname} ${this.selectedClient!.firstname}`
        });
        this.getAllClients();
      },
      error: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de mettre à jour le KYC'
        });
      }
    });
  }

  activateAccount() {
    if (!this.selectedClient) {
      return;
    }
    this.actionLoading = true;
    this.clientService.activateAccount(this.selectedClient.id, AccountStatus.ACTIVATED).subscribe({
      next: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Compte activé',
          detail: `${this.selectedClient!.lastname} ${this.selectedClient!.firstname}`
        });
        this.getAllClients();
      },
      error: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d’activer le compte'
        });
      }
    });
  }

  kycSeverity(status: string | null | undefined): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'PENDING':
        return 'warn';
      case 'REJECTED':
        return 'danger';
      case 'EXPIRED':
        return 'secondary';
      default:
        return 'info';
    }
  }

  kycLabel(status: string | null | undefined): string {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepté';
      case 'PENDING':
        return 'En attente';
      case 'REJECTED':
        return 'Rejeté';
      case 'EXPIRED':
        return 'Expiré';
      default:
        return 'Non soumis';
    }
  }

  accountSeverity(status: string | null | undefined): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    switch (status) {
      case 'ACTIVATED':
        return 'success';
      case 'SUSPENDED':
        return 'warn';
      case 'DEACTIVATED':
      case 'DELETED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  hasKycDocuments(client: Profil | null): boolean {
    if (!client) {
      return false;
    }
    return !!(client.kycFileName || client.kycVersoFileName || client.kycSelfieFileName);
  }

  private loadKycPreviews(client: Profil) {
    this.previewSub?.unsubscribe();
    this.revokeObjectUrls();
    this.kycPreview = this.emptyPreview();

    if (!this.hasKycDocuments(client)) {
      return;
    }

    this.kycPreview.loading = true;

    const load = (fileName: string | null | undefined) => {
      if (!fileName) {
        return of(null);
      }
      return this.clientService.downloadFile(fileName).pipe(
        catchError(() => of(null))
      );
    };

    this.previewSub = forkJoin({
      recto: load(client.kycFileName),
      verso: load(client.kycVersoFileName),
      selfie: load(client.kycSelfieFileName)
    }).subscribe({
      next: ({ recto, verso, selfie }) => {
        this.kycPreview = {
          rectoUrl: this.toObjectUrl(recto),
          versoUrl: this.toObjectUrl(verso),
          selfieUrl: this.toObjectUrl(selfie),
          loading: false,
          error:
            !recto && !verso && !selfie
              ? 'Impossible de charger les documents KYC'
              : null
        };
      },
      error: () => {
        this.kycPreview = {
          ...this.emptyPreview(),
          error: 'Impossible de charger les documents KYC'
        };
      }
    });
  }

  private toObjectUrl(blob: Blob | null): string | null {
    if (!blob) {
      return null;
    }
    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);
    return url;
  }

  private revokeObjectUrls() {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls = [];
  }

  private emptyPreview(): KycPreview {
    return {
      rectoUrl: null,
      versoUrl: null,
      selfieUrl: null,
      loading: false,
      error: null
    };
  }
}
