import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, catchError, firstValueFrom, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from "../models/user.model";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  detail: string | null;
  total: number | null;
  skip: number | null;
  limit: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly AUTH_TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "user";
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  redirectUrl: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    @Inject(HttpClient) private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise<void>(async (resolve) => {
      const token = this.getAuthToken();
      const cachedUser = this.getCachedUser();
      
      if (cachedUser) {
        this.currentUserSubject.next(cachedUser);
      }
      
      if (token) {
        try {
          const response = await firstValueFrom(this.fetchCurrentUser());
          if (response.success) {
            this.currentUserSubject.next(response.data);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
          }
        } catch (error) {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.clearAuth();
          }
        }
      }
      
      resolve();
    });

    return this.initializationPromise;
  }

  private getCachedUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  async ensureAuthInitialized(): Promise<void> {
    return this.initializeAuth();
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, formData)
      .pipe(
        tap((response) => {
          localStorage.setItem(this.AUTH_TOKEN_KEY, response.access_token);
          this.currentUserSubject.next(response.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          
          // Get return URL from route parameters or saved redirect URL
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || this.redirectUrl;
          
          if (returnUrl) {
            // Clear the saved redirect URL
            this.redirectUrl = null;
            // Navigate to the return URL
            this.router.navigate([returnUrl], { replaceUrl: true });
          } else {
            // Default navigation
            this.router.navigate(['/manage'], { replaceUrl: true });
          }
        })
      );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/']);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.redirectUrl = null;
  }

  fetchCurrentUser(): Observable<StandardResponse<User>> {
    return this.http.get<StandardResponse<User>>(`${this.apiUrl}/users/me`).pipe(
      tap(response => {
        if (response.success) {
          this.currentUserSubject.next(response.data);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearAuth();
        }
        throw error;
      })
    );
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAuthToken() && !!this.currentUserSubject.value;
  }
} 
