import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AccountStatus, Role, User } from '../../models/user.model';
import { UserApiService } from '../../services/user-api.service';

function minSelectedValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return Array.isArray(value) && value.length >= min ? null : { minSelected: { min } };
  };
}

@Component({
  selector: 'app-admin-management',
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
    MultiSelectModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.scss']
})
export class AdminManagementComponent implements OnInit {
  admins: User[] = [];
  filteredAdmins: User[] = [];
  roles: Role[] = [];

  loading = false;
  saving = false;
  showCreateDialog = false;
  showRolesDialog = false;

  rolesTarget: User | null = null;
  selectedRoleIds: number[] = [];
  searchTerm = '';

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
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleIds: [[], [minSelectedValidator(1)]],
      activate: [true]
    });
    this.loadRoles();
    this.loadAdmins();
  }

  private normalizeUser(u: User): User {
    return {
      ...u,
      roles: Array.isArray(u.roles) ? u.roles : u.roles ? [u.roles as unknown as Role] : []
    };
  }

  private isAdminUser(user: User): boolean {
    return (user.roles ?? []).some((r) => r.roleName?.toUpperCase() === 'ADMIN');
  }

  loadAdmins(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.admins = (data ?? []).map((u) => this.normalizeUser(u)).filter((u) => this.isAdminUser(u));
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.toast('error', 'Erreur', 'Impossible de charger les administrateurs');
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data) => {
        this.roles = (data ?? []).filter((r) => !r.deleted);
        this.preselectAdminRole();
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de charger les permissions')
    });
  }

  private preselectAdminRole(): void {
    const adminRole = this.roles.find((r) => r.roleName?.toUpperCase() === 'ADMIN');
    if (adminRole && this.createForm) {
      const current: number[] = this.createForm.get('roleIds')?.value ?? [];
      if (!current.includes(adminRole.id)) {
        this.createForm.patchValue({ roleIds: [adminRole.id, ...current] });
      }
    }
  }

  applyFilters(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAdmins = [...this.admins];
      return;
    }

    const q = this.searchTerm.toLowerCase();
    this.filteredAdmins = this.admins.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.roles?.some((r) => r.roleName?.toLowerCase().includes(q))
    );
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filteredAdmins = [...this.admins];
  }

  openCreate(): void {
    this.createForm.reset({
      username: '',
      email: '',
      password: '',
      roleIds: [],
      activate: true
    });
    this.preselectAdminRole();
    this.showCreateDialog = true;
  }

  hideCreateDialog(): void {
    this.showCreateDialog = false;
    this.saving = false;
    this.createForm.reset({ activate: true, roleIds: [] });
  }

  saveAdmin(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.value;
    this.saving = true;
    this.userService
      .createAdmin({
        username: value.username,
        email: value.email,
        password: value.password,
        roleIds: value.roleIds,
        activate: !!value.activate
      })
      .subscribe({
        next: () => {
          this.toast('success', 'Succès', 'Administrateur créé');
          this.hideCreateDialog();
          this.loadAdmins();
        },
        error: (err) => {
          const detail = err?.error?.error || err?.error?.message || 'Impossible de créer l’administrateur';
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
            this.loadAdmins();
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
          this.toast('success', 'Succès', 'Permissions mises à jour');
          this.hideRolesDialog();
          this.loadAdmins();
        },
        error: (err) => {
          const detail = err?.error?.error || err?.error?.message || 'Impossible de mettre à jour les permissions';
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
