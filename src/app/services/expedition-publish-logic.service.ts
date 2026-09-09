import { Injectable } from '@angular/core';
import { OpeningHoursEntry } from '../models/collectionPoint.model';

/** Point de collecte minimal pour le calcul des jours ouvrés (aligné publish-ride). */
export interface CollectionPointSchedule {
  openingHours?: OpeningHoursEntry[];
}

export interface ExpeditionDateConstraints {
  departureMinDate: Date;
  packageRetrivalDateMin: Date;
  packageRetrivalDateMax: Date;
  receiptDateMin: Date;
  receiptDateMax: Date;
  deliveryDateMin: Date;
  deliveryDateMax: Date;
  closedDayNumbers: number[];
}

export interface ExpeditionDatesOnDeparture {
  packageRetrivalDate: Date;
  receiptDate: Date;
  deliveryDate: Date;
  constraints: ExpeditionDateConstraints;
}

@Injectable({ providedIn: 'root' })
export class ExpeditionPublishLogicService {
  readonly DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

  /** Même règle que publish-ride : pas de départ avant J+3. */
  defaultDepartureMinDate(from: Date = new Date()): Date {
    const min = new Date(from);
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 3);
    return min;
  }

  computeFinalPrice(baseFee: number, commissionRate: number, tvaRate: number): number {
    const commission = baseFee * commissionRate;
    const tvaOnCommission = commission * tvaRate;
    return +(baseFee + commission + tvaOnCommission).toFixed(2);
  }

  clampFee(value: number, minFee: number, maxFee: number): number {
    return Math.min(maxFee, Math.max(minFee, value));
  }

  computeClosedDayNumbers(points: CollectionPointSchedule[]): number[] {
    const withHours = points.filter((p) => p.openingHours?.length);
    if (!withHours.length) {
      return [];
    }
    const closed = new Set<number>();
    for (const cp of withHours) {
      for (const h of cp.openingHours ?? []) {
        if (!h.closed) {
          continue;
        }
        const n = this.DAY_NAMES.indexOf(h.day as (typeof this.DAY_NAMES)[number]);
        if (n >= 0) {
          closed.add(n);
        }
      }
    }
    return [...closed];
  }

  /**
   * Recalcule les dates dérivées quand la date de départ change
   * (logique identique à publish-ride.depDateSelected).
   */
  computeDatesOnDeparture(
    departure: Date,
    collectionPoints: CollectionPointSchedule[],
    departureMinDate?: Date
  ): ExpeditionDatesOnDeparture {
    const dep = new Date(departure);
    dep.setHours(0, 0, 0, 0);

    const retraitBase = new Date(dep);
    retraitBase.setDate(retraitBase.getDate() - 1);
    const packageRetrivalDate = this.findPreviousOpenDay(retraitBase, collectionPoints);

    const depotBase = new Date(packageRetrivalDate);
    depotBase.setDate(depotBase.getDate() - 1);
    const receiptDate = this.findPreviousOpenDay(depotBase, collectionPoints);

    const livraisonBase = new Date(dep);
    livraisonBase.setDate(livraisonBase.getDate() + 1);
    const deliveryDate = this.findNextOpenDay(livraisonBase, collectionPoints);

    const todayRetrait = new Date();
    todayRetrait.setHours(0, 0, 0, 0);
    const maxRetrait = new Date(dep);
    maxRetrait.setDate(maxRetrait.getDate() - 1);

    const closedDayNumbers = this.computeClosedDayNumbers(collectionPoints);

    return {
      packageRetrivalDate,
      receiptDate,
      deliveryDate,
      constraints: {
        departureMinDate: departureMinDate ?? this.defaultDepartureMinDate(),
        packageRetrivalDateMin: todayRetrait,
        packageRetrivalDateMax: maxRetrait,
        receiptDateMin: receiptDate,
        receiptDateMax: receiptDate,
        deliveryDateMin: deliveryDate,
        deliveryDateMax: deliveryDate,
        closedDayNumbers
      }
    };
  }

  /** Contraintes initiales avant sélection de la date de départ (publish-ride.initializeDateConstraints). */
  initialDateConstraints(departureMinDate?: Date): ExpeditionDateConstraints {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 100);
    const pastDate = new Date(0);

    return {
      departureMinDate: departureMinDate ?? this.defaultDepartureMinDate(),
      packageRetrivalDateMin: futureDate,
      packageRetrivalDateMax: pastDate,
      receiptDateMin: futureDate,
      receiptDateMax: pastDate,
      deliveryDateMin: futureDate,
      deliveryDateMax: pastDate,
      closedDayNumbers: []
    };
  }

  private isOpenDay(date: Date, points: CollectionPointSchedule[]): boolean {
    const withHours = points.filter((p) => p.openingHours?.length);
    if (!withHours.length) {
      const d = date.getDay();
      return d !== 0 && d !== 6;
    }
    const dayName = this.DAY_NAMES[date.getDay()];
    return withHours.every((p) => {
      const entry = p.openingHours!.find((h) => h.day === dayName);
      return entry ? !entry.closed : true;
    });
  }

  private findPreviousOpenDay(from: Date, points: CollectionPointSchedule[]): Date {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    let safety = 0;
    while (!this.isOpenDay(d, points) && safety < 14) {
      d.setDate(d.getDate() - 1);
      safety++;
    }
    return d;
  }

  private findNextOpenDay(from: Date, points: CollectionPointSchedule[]): Date {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    let safety = 0;
    while (!this.isOpenDay(d, points) && safety < 14) {
      d.setDate(d.getDate() + 1);
      safety++;
    }
    return d;
  }
}
