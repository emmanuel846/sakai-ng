import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  // Un BehaviorSubject pour surveiller l'état du loader (visible/invisible)
  private isLoading = new BehaviorSubject<boolean>(false);

  get isLoading$() {
    return this.isLoading.asObservable();
  }

  showLoader(): void {
    this.isLoading.next(true);
  }

  hideLoader(): void {
    this.isLoading.next(false);
  }
}
