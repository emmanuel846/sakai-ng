import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { ReferralAccess, ReferralAccessMode, ReferralAdmin, ReferralStatus } from '../../models/referral.model';
import { ReferralApiService } from '../../services/referral-api.service';
import { ClientService } from '../clients/client.service';
import { Profil } from '../../models/profil.model';

interface ClientOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ToastModule,
    ButtonModule,
    ToggleSwitchModule,
    SelectButtonModule,
    MultiSelectModule
  ],
  providers: [MessageService],
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.scss']
})
export class ReferralsComponent implements OnInit {
  referrals: ReferralAdmin[] = [];
  loading = false;
  accessLoading = false;
  accessSaving = false;

  enabled = true;
  accessMode: ReferralAccessMode = 'ALL';
  allowedClientIds: string[] = [];
  clientOptions: ClientOption[] = [];

  readonly accessModeOptions: { label: string; value: ReferralAccessMode }[] = [
    { label: 'Tout le monde', value: 'ALL' },
    { label: 'Utilisateurs sélectionnés', value: 'SELECTED' }
  ];

  constructor(
    private api: ReferralApiService,
    private clientService: ClientService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadAccess();
    this.loadClients();
  }

  get totalCount(): number {
    return this.referrals.length;
  }

  get pendingCount(): number {
    return this.referrals.filter(item => item.status === 'PENDING').length;
  }

  get rewardedCount(): number {
    return this.referrals.filter(item => item.status === 'REWARDED').length;
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (items) => {
        this.referrals = items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les parrainages.'
        });
      }
    });
  }

  loadAccess(): void {
    this.accessLoading = true;
    this.api.getAccess().subscribe({
      next: (access) => {
        this.applyAccess(access);
        this.accessLoading = false;
      },
      error: () => {
        this.accessLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la configuration du parrainage.'
        });
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clientOptions = (clients || [])
          .filter(client => !!client?.id)
          .map(client => ({
            label: this.clientLabel(client),
            value: client.id
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la liste des utilisateurs.'
        });
      }
    });
  }

  saveAccess(): void {
    if (this.accessSaving) {
      return;
    }
    this.accessSaving = true;
    const payload: ReferralAccess = {
      enabled: this.enabled,
      accessMode: this.accessMode,
      allowedClientIds: this.accessMode === 'SELECTED' ? [...this.allowedClientIds] : this.allowedClientIds
    };
    this.api.updateAccess(payload).subscribe({
      next: (access) => {
        this.applyAccess(access);
        this.accessSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Enregistré',
          detail: this.accessMode === 'ALL'
            ? 'Le parrainage est ouvert à tout le monde.'
            : `${this.allowedClientIds.length} utilisateur(s) autorisé(s) à parrainer.`
        });
      },
      error: () => {
        this.accessSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d’enregistrer la configuration.'
        });
      }
    });
  }

  statusSeverity(status: ReferralStatus): 'success' | 'info' | 'warn' {
    if (status === 'REWARDED') {
      return 'success';
    }
    if (status === 'PENDING') {
      return 'info';
    }
    return 'warn';
  }

  statusLabel(status: ReferralStatus): string {
    if (status === 'REWARDED') {
      return 'Récompensé';
    }
    if (status === 'PENDING') {
      return 'En attente';
    }
    return 'Non éligible';
  }

  private applyAccess(access: ReferralAccess): void {
    this.enabled = !!access?.enabled;
    this.accessMode = access?.accessMode === 'SELECTED' ? 'SELECTED' : 'ALL';
    this.allowedClientIds = [...(access?.allowedClientIds || [])];
  }

  private clientLabel(client: Profil): string {
    const name = `${client.firstname || ''} ${client.lastname || ''}`.trim();
    const pseudo = client.public_pseudo?.trim();
    const email = client.users?.email?.trim();
    const suffix = pseudo || email;
    if (name && suffix) {
      return `${name} · ${suffix}`;
    }
    return name || suffix || client.id;
  }
}
