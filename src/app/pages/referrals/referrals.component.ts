import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReferralAdmin, ReferralStatus } from '../../models/referral.model';
import { ReferralApiService } from '../../services/referral-api.service';

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.scss']
})
export class ReferralsComponent implements OnInit {
  referrals: ReferralAdmin[] = [];
  loading = false;

  constructor(
    private api: ReferralApiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
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
}
