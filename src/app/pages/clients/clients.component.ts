import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Table, TableModule, TableRowSelectEvent } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Profil } from '../../models/profil.model';
import { Role, User } from '../../models/user.model';
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
    DialogModule,
    MultiSelectModule,
    ToolbarModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    TagModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    DividerModule,
    TooltipModule,
    SelectButtonModule,
    TabsModule
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
  userActionLoading = false;
  activeDetailTab: string | number = 'client';

  roles: Role[] = [];
  showRolesDialog = false;
  selectedRoleIds: number[] = [];
  rolesSaving = false;

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
    this.loadRoles();
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
          detail: 'Impossible de charger les comptes'
        });
      }
    });
  }

  loadRoles() {
    this.userApi.getRoles().subscribe({
      next: (data) => {
        this.roles = (data ?? []).filter((r) => !r.deleted);
      },
      error: () => undefined
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
    this.activeDetailTab = 'client';
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
    this.activeDetailTab = 'client';
    this.previewSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.revokeObjectUrls();
    this.kycPreview = this.emptyPreview();
  }

  confirmValidateAccount(status: VerificationStatus, event?: Event) {
    if (!this.selectedClient) {
      return;
    }
    const name = `${this.selectedClient.lastname} ${this.selectedClient.firstname}`;
    const dialog = this.kycActionDialog(status, name);
    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: dialog.message,
      header: dialog.header,
      icon: dialog.icon,
      acceptLabel: dialog.acceptLabel,
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: dialog.acceptStyle,
      accept: () => this.validateAccount(status)
    });
  }

  confirmActivateClientAccount(event?: Event) {
    if (!this.selectedClient) {
      return;
    }
    const name = `${this.selectedClient.lastname} ${this.selectedClient.firstname}`;
    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: `Confirmer l’activation du profil client de <strong>${name}</strong> ?`,
      header: 'Activer le profil client',
      icon: 'pi pi-user-plus',
      acceptLabel: 'Activer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-primary',
      accept: () => this.activateClientAccount()
    });
  }

  confirmToggleUserActivation(event?: Event) {
    if (!this.linkedUser) {
      return;
    }
    const activate = this.linkedUser.status !== 'ACTIVATED';
    const action = activate ? 'activer' : 'désactiver';
    this.confirmationService.confirm({
      target: event?.currentTarget as EventTarget,
      message: `Voulez-vous vraiment ${action} le compte utilisateur <strong>${this.linkedUser.username}</strong> ?`,
      header: activate ? 'Activer l’utilisateur' : 'Désactiver l’utilisateur',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: activate ? 'Activer' : 'Désactiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: activate ? 'p-button-success' : 'p-button-danger',
      accept: () => this.toggleUserActivation(activate)
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
        const feedback = this.kycActionFeedback(status);
        this.messageService.add({
          severity: feedback.severity,
          summary: feedback.summary,
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

  activateClientAccount() {
    if (!this.selectedClient) {
      return;
    }
    this.actionLoading = true;
    this.clientService.activateAccount(this.selectedClient.id, AccountStatus.ACTIVATED).subscribe({
      next: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Profil client activé',
          detail: `${this.selectedClient!.lastname} ${this.selectedClient!.firstname}`
        });
        this.getAllClients();
      },
      error: () => {
        this.actionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d’activer le profil client'
        });
      }
    });
  }

  toggleUserActivation(activate: boolean) {
    if (!this.linkedUser) {
      return;
    }
    this.userActionLoading = true;
    this.userApi.activateAccount({ userId: this.linkedUser.id, value: activate }).subscribe({
      next: (user) => {
        this.linkedUser = {
          ...user,
          roles: Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles as unknown as Role] : []
        };
        this.userActionLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: activate ? 'Utilisateur activé' : 'Utilisateur désactivé',
          detail: this.linkedUser.username
        });
      },
      error: () => {
        this.userActionLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Impossible de ${activate ? 'activer' : 'désactiver'} l’utilisateur`
        });
      }
    });
  }

  openRolesDialog() {
    if (!this.linkedUser) {
      return;
    }
    this.selectedRoleIds = (this.linkedUser.roles ?? []).map((r) => r.id);
    this.showRolesDialog = true;
  }

  hideRolesDialog() {
    this.showRolesDialog = false;
    this.selectedRoleIds = [];
    this.rolesSaving = false;
  }

  saveRoles() {
    if (!this.linkedUser) {
      return;
    }

    const currentIds = new Set((this.linkedUser.roles ?? []).map((r) => r.id));
    const nextIds = new Set(this.selectedRoleIds);
    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

    if (!toAdd.length && !toRemove.length) {
      this.hideRolesDialog();
      return;
    }

    this.rolesSaving = true;
    const userId = this.linkedUser.id;
    const add$ = toAdd.length ? this.userApi.addRoles({ userId, roleIds: toAdd }) : of({ message: 'noop' });
    const remove$ = toRemove.length
      ? this.userApi.removeRoles({ userId, roleIds: toRemove })
      : of({ message: 'noop' });

    forkJoin([add$, remove$])
      .pipe(switchMap(() => this.userApi.getById(userId)))
      .subscribe({
        next: (user) => {
          this.linkedUser = {
            ...user,
            roles: Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles as unknown as Role] : []
          };
          this.messageService.add({
            severity: 'success',
            summary: 'Rôles mis à jour',
            detail: this.linkedUser.username
          });
          this.hideRolesDialog();
        },
        error: (err) => {
          const detail = err?.error?.error || err?.error?.message || 'Impossible de mettre à jour les rôles';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail });
          this.rolesSaving = false;
        }
      });
  }

  private kycActionDialog(
    status: VerificationStatus,
    name: string
  ): { message: string; header: string; icon: string; acceptLabel: string; acceptStyle: string } {
    switch (status) {
      case VerificationStatus.ACCEPTED:
        return {
          message: `Confirmer l’acceptation du KYC de <strong>${name}</strong> ?`,
          header: 'Accepter le KYC',
          icon: 'pi pi-check-circle',
          acceptLabel: 'Accepter',
          acceptStyle: 'p-button-success'
        };
      case VerificationStatus.PENDING:
        return {
          message: `Annuler le rejet et remettre le KYC de <strong>${name}</strong> en attente ?`,
          header: 'Annuler le rejet',
          icon: 'pi pi-replay',
          acceptLabel: 'Confirmer',
          acceptStyle: 'p-button-warning'
        };
      default:
        return {
          message: `Confirmer le rejet du KYC de <strong>${name}</strong> ?`,
          header: 'Rejeter le KYC',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Rejeter',
          acceptStyle: 'p-button-danger'
        };
    }
  }

  private kycActionFeedback(
    status: VerificationStatus
  ): { severity: 'success' | 'warn' | 'info'; summary: string } {
    switch (status) {
      case VerificationStatus.ACCEPTED:
        return { severity: 'success', summary: 'KYC accepté' };
      case VerificationStatus.PENDING:
        return { severity: 'info', summary: 'Rejet annulé — KYC remis en attente' };
      default:
        return { severity: 'warn', summary: 'KYC rejeté' };
    }
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

  roleNames(user: User | null): string {
    return user?.roles?.map((r) => r.roleName).join(', ') || '—';
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

    if (!client.usersId) {
      this.linkedUserLoading = false;
      return;
    }

    this.linkedUserLoading = true;
    this.userSub = this.userApi.getById(client.usersId).pipe(catchError(() => of(null))).subscribe({
      next: (user) => {
        this.linkedUser = user
          ? {
              ...user,
              roles: Array.isArray(user.roles) ? user.roles : user.roles ? [user.roles as unknown as Role] : []
            }
          : null;
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
