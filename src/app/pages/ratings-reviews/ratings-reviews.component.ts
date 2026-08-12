import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { RatingModule } from 'primeng/rating';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

import { PlatformFeedbackAdmin, UserRatingAdmin } from '../../models/rating.model';
import { RatingApiService } from '../../services/rating-api.service';

@Component({
  selector: 'app-ratings-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TabsModule,
    RatingModule
  ],
  providers: [MessageService],
  templateUrl: './ratings-reviews.component.html',
  styleUrls: ['./ratings-reviews.component.scss']
})
export class RatingsReviewsComponent implements OnInit {
  activeTab: number | string = 0;

  userRatings: UserRatingAdmin[] = [];
  filteredUserRatings: UserRatingAdmin[] = [];
  platformFeedback: PlatformFeedbackAdmin[] = [];
  filteredPlatformFeedback: PlatformFeedbackAdmin[] = [];

  loading = false;
  userSearch = '';
  platformSearch = '';
  userScoreFilter: number | null = null;
  platformScoreFilter: number | null = null;

  readonly scoreOptions = [
    { label: 'Toutes les notes', value: null },
    { label: '5 étoiles', value: 5 },
    { label: '4 étoiles', value: 4 },
    { label: '3 étoiles', value: 3 },
    { label: '2 étoiles', value: 2 },
    { label: '1 étoile', value: 1 }
  ];

  constructor(
    private ratingApi: RatingApiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      userRatings: this.ratingApi.listUserRatings(),
      platformFeedback: this.ratingApi.listPlatformFeedback()
    }).subscribe({
      next: ({ userRatings, platformFeedback }) => {
        this.userRatings = userRatings ?? [];
        this.platformFeedback = platformFeedback ?? [];
        this.applyUserFilter();
        this.applyPlatformFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les avis et notes.'
        });
      }
    });
  }

  get userCount(): number {
    return this.userRatings.length;
  }

  get platformCount(): number {
    return this.platformFeedback.length;
  }

  get userAverage(): number {
    if (!this.userRatings.length) {
      return 0;
    }
    const sum = this.userRatings.reduce((acc, r) => acc + (r.score ?? 0), 0);
    return Math.round((sum / this.userRatings.length) * 10) / 10;
  }

  get platformAverage(): number {
    if (!this.platformFeedback.length) {
      return 0;
    }
    const sum = this.platformFeedback.reduce((acc, r) => acc + (r.score ?? 0), 0);
    return Math.round((sum / this.platformFeedback.length) * 10) / 10;
  }

  applyUserFilter(): void {
    const term = this.userSearch.trim().toLowerCase();
    this.filteredUserRatings = this.userRatings.filter((r) => {
      if (this.userScoreFilter != null && r.score !== this.userScoreFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        r.raterPseudo,
        r.raterName,
        r.ratedPseudo,
        r.ratedName,
        r.comment,
        r.reservationId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  applyPlatformFilter(): void {
    const term = this.platformSearch.trim().toLowerCase();
    this.filteredPlatformFeedback = this.platformFeedback.filter((r) => {
      if (this.platformScoreFilter != null && r.score !== this.platformScoreFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        r.clientPseudo,
        r.clientName,
        r.comment,
        r.reservationId,
        r.expeditionId
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  displayUser(pseudo: string, name: string): string {
    if (pseudo?.trim()) {
      return pseudo;
    }
    if (name?.trim()) {
      return name;
    }
    return '—';
  }

  shortId(id: string | null | undefined): string {
    if (!id) {
      return '—';
    }
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  }

  scoreSeverity(score: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (score >= 5) return 'success';
    if (score >= 4) return 'info';
    if (score >= 3) return 'warn';
    if (score >= 1) return 'danger';
    return 'secondary';
  }
}
