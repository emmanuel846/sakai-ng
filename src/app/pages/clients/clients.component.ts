import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
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
import { User } from '../../models/user.model';
import { UserApiService } from '../../services/user-api.service';
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
    ConfirmDialogModule,
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
  providers: [MessageService, ConfirmationService],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit, OnDestroy {
  clients: Profil[] = [];
  filteredClients: Profil[] = [];
  selectedClient: Profil | null = null;
  linkedUser: User | null = null;
  linkedUserLoading = false;
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
  private userSub?: Subscription;
  private objectUrls: string[] = [];

  constructor(
    private clientService: ClientService,
    private userApi: UserApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.getAllClients();
  }

  ngOnDestroy() {
    this.previewSub?.unsubscribe();
    this.userSub?.unsubscribe();
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
            this.loadLinkedUser(refreshed);
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
    this.loadLinkedUser(client);
  }

  onRowUnselect() {
    this.clearSelection();
  }

  clearSelection() {
    this.selectedClient = null;
    this.linkedUser = null;
    this.linkedUserLoading = false;
    this.previewSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.revokeObjectUrls();
    this.kycPreview = this.emptyPreview();
  }

  confirmValidateAccount(status: VerificationStatus, event?: Event) {
    if (!this.selectedClient) {
      return;
    }
    const accepted = status === VerificationStatus.ACCEPTED;
    const name = `${this.selectedClient.lastname} ${this.selectedClient.firstname}`;
    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: accepted
        ? `Confirmer l’acceptation du KYC de <strong>${name}</strong> ?`
        : `Confirmer le rejet du KYC de <strong>${name}</strong> ?`,
      header: accepted ? 'Accepter le KYC' : 'Rejeter le KYC',
      icon: accepted ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle',
      acceptLabel: accepted ? 'Accepter' : 'Rejeter',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: accepted ? 'p-button-success' : 'p-button-danger',
      accept: () => this.validateAccount(status)
    });
  }

  confirmActivateAccount(event?: Event) {
    if (!this.selectedClient) {
      return;
    }
    const name = `${this.selectedClient.lastname} ${this.selectedClient.firstname}`;
    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: `Confirmer l’activation du compte de <strong>${name}</strong> ?`,
      header: 'Activer le compte',
      icon: 'pi pi-user-plus',
      acceptLabel: 'Activer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-primary',
      accept: () => this.activateAccount()
    });
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

  accountLabel(status: string | null | undefined): string {
    switch (status) {
      case 'ACTIVATED':
        return 'Activé';
      case 'CREATED':
        return 'Créé';
      case 'SUSPENDED':
        return 'Suspendu';
      case 'DEACTIVATED':
        return 'Désactivé';
      default:
        return status || '—';
    }
  }

  genderLabel(gender: string | null | undefined): string {
    switch ((gender || '').toUpperCase()) {
      case 'MALE':
        return 'Homme';
      case 'FEMALE':
        return 'Femme';
      case 'OTHER':
        return 'Autre';
      default:
        return gender || '—';
    }
  }

  displayValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  ratingLabel(client: Profil | null): string {
    if (!client) {
      return '—';
    }
    const rating = client.rating ?? 0;
    const counts = client.rating_counts ?? 0;
    return `${rating}/5 (${counts} avis)`;
  }

  hasKycDocuments(client: Profil | null): boolean {
    if (!client) {
      return false;
    }
    return !!(client.kycFileName || client.kycVersoFileName || client.kycSelfieFileName);
  }

  private loadLinkedUser(client: Profil) {
    this.userSub?.unsubscribe();
    this.linkedUser = null;

    if (client.users?.email || client.users?.username) {
      this.linkedUser = {
        id: Number(client.users.id ?? client.usersId),
        username: client.users.username || '—',
        email: client.users.email || '—',
        roles: [],
        status: client.users.isActive ? 'ACTIVATED' : 'DEACTIVATED',
        twoFactor: false,
        locked: false,
        emailVerifiated: false
      };
      return;
    }

    if (!client.usersId) {
      return;
    }

    this.linkedUserLoading = true;
    this.userSub = this.userApi.getById(client.usersId).pipe(catchError(() => of(null))).subscribe({
      next: (user) => {
        this.linkedUser = user;
        this.linkedUserLoading = false;
      },
      error: () => {
        this.linkedUser = null;
        this.linkedUserLoading = false;
      }
    });
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
      return this.clientService.downloadFile(fileName).pipe(catchError(() => of(null)));
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
          error: !recto && !verso && !selfie ? 'Impossible de charger les documents KYC' : null
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
