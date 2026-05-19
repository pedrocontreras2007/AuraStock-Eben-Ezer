import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  branchId: string | null;
  branchName: string | null;
}

interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: UserSession | null;
  readonly token: string | null;
}

const STORAGE_KEY = 'aurastock-auth-state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  private readonly stateSubject = new BehaviorSubject<AuthState>(this.restoreSession());

  readonly state$ = this.stateSubject.asObservable();

  get isAuthenticated(): boolean {
    return this.stateSubject.value.isAuthenticated;
  }

  get user(): UserSession | null {
    return this.stateSubject.value.user;
  }

  get token(): string | null {
    return this.stateSubject.value.token;
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response: any = await lastValueFrom(
        this.http.post(`${this.API_URL}auth/login`, { email, password })
      );
      if (response.success && response.data) {
        this.updateState(true, response.data.user, response.data.token);
        return { success: true };
      }
      return { success: false, error: response.error || 'Error al iniciar sesión' };
    } catch (err: any) {
      const msg = err.error?.error || 'Error de conexión con el servidor';
      return { success: false, error: msg };
    }
  }

  async getTenants(): Promise<TenantInfo[]> {
    try {
      const response: any = await lastValueFrom(
        this.http.get(`${this.API_URL}auth/tenants`)
      );
      return response.data || [];
    } catch {
      return [];
    }
  }

  logout(): void {
    this.updateState(false, null, null);
  }

  private updateState(isAuthenticated: boolean, user: UserSession | null, token: string | null): void {
    const nextState: AuthState = { isAuthenticated, user, token };
    this.stateSubject.next(nextState);
    this.persistSession(nextState);
  }

  private restoreSession(): AuthState {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return { isAuthenticated: false, user: null, token: null };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { isAuthenticated: false, user: null, token: null };
      const parsed = JSON.parse(raw) as AuthState;
      if (parsed && parsed.isAuthenticated && parsed.token) return parsed;
      return { isAuthenticated: false, user: null, token: null };
    } catch {
      return { isAuthenticated: false, user: null, token: null };
    }
  }

  private persistSession(state: AuthState): void {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    if (state.isAuthenticated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}
