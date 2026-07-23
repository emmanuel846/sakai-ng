import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AccountStatus, Role, User } from '../../models/user.model';
import { UserApiService } from '../../services/user-api.service';

interface Stats {
  total: number;
  activated: number;
  deactivated: number;
  locked: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    MultiSelectModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];

  stats: Stats = { total: 0, activated: 0, deactivated: 0, locked: 0 };

  loading = false;
  saving = false;
  showCreateDialog = false;
  showRolesDialog = false;

  rolesTarget: User | null = null;
  selectedRoleIds: number[] = [];

  filterStatus: AccountStatus | null = null;
  searchTerm = '';

  statusFilterOptions: { label: string; value: AccountStatus }[] = [
    { label: 'Créé', value: 'CREATED' },
    { label: 'Activé', value: 'ACTIVATED' },
    { label: 'Désactivé', value: 'DEACTIVATED' },
    { label: 'Suspendu', value: 'SUSPENDED' }
  ];

  createForm!: FormGroup;

  constructor(
    private userService: UserApiService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.loadAll();
    this.loadRoles();
  }

  loadAll(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.allUsers = (data ?? []).map((u) => ({
          ...u,
          roles: Array.isArray(u.roles) ? u.roles : u.roles ? [u.roles as unknown as Role] : []
        }));
        this.filteredUsers = [...this.allUsers];
        this.computeStats();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.toast('error', 'Erreur', 'Impossible de charger les utilisateurs');
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data) => {
        this.roles = (data ?? []).filter((r) => !r.deleted);
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de charger les rôles')
    });
  }

  computeStats(): void {
    this.stats = {
      total: this.allUsers.length,
      activated: this.allUsers.filter((u) => u.status === 'ACTIVATED').length,
      deactivated: this.allUsers.filter((u) => u.status === 'DEACTIVATED' || u.status === 'SUSPENDED').length,
      locked: this.allUsers.filter((u) => u.locked).length
    };
  }

  applyFilters(): void {
    let result = [...this.allUsers];

    if (this.filterStatus) {
      result = result.filter((u) => u.status === this.filterStatus);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.roles?.some((r) => r.roleName?.toLowerCase().includes(q))
      );
    }

    this.filteredUsers = result;
  }

  resetFilters(): void {
    this.filterStatus = null;
    this.searchTerm = '';
    this.filteredUsers = [...this.allUsers];
  }

  openCreate(): void {
    this.createForm.reset();
    this.showCreateDialog = true;
  }

  hideCreateDialog(): void {
    this.showCreateDialog = false;
    this.saving = false;
    this.createForm.reset();
  }

  saveUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.userService.create(this.createForm.value).subscribe({
      next: () => {
        this.toast('success', 'Succès', 'Utilisateur créé');
        this.hideCreateDialog();
        this.loadAll();
      },
      error: (err) => {
        const detail = err?.error?.message || err?.error?.error || 'Impossible de créer l’utilisateur';
        this.toast('error', 'Erreur', detail);
        this.saving = false;
      }
    });
  }

  toggleActivation(user: User): void {
    const activate = user.status !== 'ACTIVATED';
    const action = activate ? 'activer' : 'désactiver';

    this.confirmationService.confirm({
      message: `Voulez-vous vraiment ${action} le compte <strong>${user.username}</strong> ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: activate ? 'Activer' : 'Désactiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: activate ? 'p-button-success' : 'p-button-danger',
      accept: () => {
        this.userService.activateAccount({ userId: user.id, value: activate }).subscribe({
          next: () => {
            this.toast('success', 'Succès', `Compte ${activate ? 'activé' : 'désactivé'}`);
            this.loadAll();
          },
          error: () => this.toast('error', 'Erreur', `Impossible de ${action} ce compte`)
        });
      }
    });
  }

  openRolesDialog(user: User): void {
    this.rolesTarget = user;
    this.selectedRoleIds = (user.roles ?? []).map((r) => r.id);
    this.showRolesDialog = true;
  }

  hideRolesDialog(): void {
    this.showRolesDialog = false;
    this.rolesTarget = null;
    this.selectedRoleIds = [];
    this.saving = false;
  }

  saveRoles(): void {
    if (!this.rolesTarget) return;

    const currentIds = new Set((this.rolesTarget.roles ?? []).map((r) => r.id));
    const nextIds = new Set(this.selectedRoleIds);

    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));

    if (!toAdd.length && !toRemove.length) {
      this.hideRolesDialog();
      return;
    }

    this.saving = true;
    const userId = this.rolesTarget.id;

    const add$ = toAdd.length
      ? this.userService.addRoles({ userId, roleIds: toAdd })
      : of({ message: 'noop' });
    const remove$ = toRemove.length
      ? this.userService.removeRoles({ userId, roleIds: toRemove })
      : of({ message: 'noop' });

    forkJoin([add$, remove$])
      .pipe(switchMap(() => this.userService.getById(userId)))
      .subscribe({
        next: () => {
          this.toast('success', 'Succès', 'Rôles mis à jour');
          this.hideRolesDialog();
          this.loadAll();
        },
        error: (err) => {
          const detail = err?.error?.error || err?.error?.message || 'Impossible de mettre à jour les rôles';
          this.toast('error', 'Erreur', detail);
          this.saving = false;
        }
      });
  }

  getStatusLabel(status: AccountStatus | string): string {
    const map: Record<string, string> = {
      CREATED: 'Créé',
      ACTIVATED: 'Activé',
      DEACTIVATED: 'Désactivé',
      SUSPENDED: 'Suspendu'
    };
    return map[status] ?? status;
  }

  getStatusSeverity(status: AccountStatus | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      CREATED: 'info',
      ACTIVATED: 'success',
      DEACTIVATED: 'danger',
      SUSPENDED: 'warn'
    };
    return map[status] ?? 'secondary';
  }

  getRoleNames(user: User): string {
    return user.roles?.map((r) => r.roleName).join(', ') || '—';
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
