import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service'; // Chemin vers votre AuthService
import { catchError, finalize, switchMap, throwError } from 'rxjs';
import { LoaderService } from './loader.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Inject AuthService pour récupérer le token d'authentification
  const authService = inject(AuthService);
  const loaderService = inject(LoaderService);
  const authToken = authService.getAuthToken();

  // Liste des URLs à exclure
  const excludedUrls = [
    '/auth/login', 
    '/auth/register', 
    "/api/v1/client/register",
    '/auth/refresh-token', 
    '/public/forgotPassword',
    '/public/isUserNameAvailable',
    '/public/isEmailAvailable',
    '/public/requestForPasswordInit',
    '/location/search',
    '/public/passwordInitialization',
    '/api/v1/countries/list',
    '/api/v1/expedition/searchByCountry',
    '/api/v1/expedition/searchByCountryOnly',
  ];

  const isExcluded = excludedUrls.some(url => req.url.includes(url));
  loaderService.showLoader();
  if (isExcluded) {
    return next(req).pipe(
      finalize(()=>loaderService.hideLoader())
    );
  }

  const newReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${authToken}`),
  });

  return next(newReq).pipe(
    finalize(()=>loaderService.hideLoader()),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh-token')) {
        return authService.refreshAccessToken().pipe(
          switchMap((newAccessToken) => {
            const newAuthReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`),
            });
            return next(newAuthReq);
          })
        );
      }
      return throwError(() => error);
    })
  );
}
