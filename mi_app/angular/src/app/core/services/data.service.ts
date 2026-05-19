import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Production, ProductionInput } from '../models/harvest.model';
import { InventoryItem, InventoryItemInput } from '../models/inventory-item.model';
import { Reminder, ReminderInput } from '../models/reminder.model';
import { Loss, LossInput } from '../models/loss.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = environment.apiUrl;
  private static readonly REMINDERS_STORAGE_KEY = 'aurastock.reminders';

  private readonly productionSubject = new BehaviorSubject<Production[]>([]);
  private readonly inventorySubject = new BehaviorSubject<InventoryItem[]>([]);
  private readonly lossesSubject = new BehaviorSubject<Loss[]>([]);
  private readonly remindersSubject = new BehaviorSubject<Reminder[]>(this.loadInitialReminders());
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly production$ = this.productionSubject.asObservable();
  readonly inventory$ = this.inventorySubject.asObservable();
  readonly reminders$ = this.remindersSubject.asObservable();
  readonly losses$ = this.lossesSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.auth.state$.subscribe(state => {
      if (state.isAuthenticated) this.refreshAllData();
    });
  }

  get productionSnapshot(): Production[] { return this.productionSubject.value; }
  get inventorySnapshot(): InventoryItem[] { return this.inventorySubject.value; }
  get remindersSnapshot(): Reminder[] { return this.remindersSubject.value; }
  get lossesSnapshot(): Loss[] { return this.lossesSubject.value; }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.token;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private refreshAllData() {
    this.fetchProduction();
    this.fetchInventory();
    this.fetchLosses();
  }

  private fetchProduction() {
    this.http.get<ApiResponse<Production[]>>(`${this.API_URL}produccion`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          const data = res.data.map(item => ({
            ...item,
            date: new Date(item.date),
            recordedByUser: item.recordedByUser ?? null
          }));
          this.productionSubject.next(data);
        },
        error: () => {}
      });
  }

  private fetchInventory() {
    this.http.get<ApiResponse<InventoryItem[]>>(`${this.API_URL}inventory`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.inventorySubject.next(
            res.data.map(item => ({
              ...item,
              recordedByUser: item.recordedByUser ?? null
            }))
          );
        },
        error: () => {}
      });
  }

  private fetchLosses() {
    this.http.get<ApiResponse<Loss[]>>(`${this.API_URL}losses`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          const data = res.data.map(item => ({
            ...item,
            date: new Date(item.date),
            quantity: Number(item.quantity) || 0
          } as Loss));
          this.lossesSubject.next(data);
        },
        error: () => {}
      });
  }

  addProduction(input: ProductionInput): void {
    const recordedByUser = input.recordedByUser ?? this.auth.user?.email ?? 'sistema@aurastock.app';
    const payload: ProductionInput = { ...input, recordedByUser };
    this.http.post(`${this.API_URL}produccion`, payload, { headers: this.getAuthHeaders() }).subscribe({
      next: () => { this.fetchProduction(); this.fetchInventory(); },
      error: () => {}
    });
  }

  deleteProduction(id: string): void {
    this.http.delete(`${this.API_URL}produccion/${id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => { this.fetchProduction(); this.fetchInventory(); },
      error: () => {}
    });
  }

  addInventoryItem(input: InventoryItemInput): void {
    const recordedByUser = input.recordedByUser ?? this.auth.user?.email ?? 'sistema@aurastock.app';
    const payload: InventoryItemInput = { ...input, unit: input.unit || 'unidades', recordedByUser };
    this.http.post(`${this.API_URL}inventory`, payload, { headers: this.getAuthHeaders() }).subscribe({
      next: () => this.fetchInventory(),
      error: () => {}
    });
  }

  deleteInventoryItem(id: string): void {
    this.http.delete(`${this.API_URL}inventory/${id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => this.fetchInventory(),
      error: () => {}
    });
  }

  updateInventoryQuantity(id: string, quantity: number, recordedBy?: string, recordedByUser?: string | null): void {
    const currentItem = this.inventorySubject.value.find(i => i.id === id);
    if (!currentItem) return;
    const recordedByUserValue = recordedByUser ?? this.auth.user?.email ?? currentItem.recordedByUser ?? null;
    const updateData = {
      ...currentItem,
      quantity,
      recordedBy: recordedBy || currentItem.recordedBy || '',
      recordedByUser: recordedByUserValue
    };
    this.http.put(`${this.API_URL}inventory/${id}`, updateData, { headers: this.getAuthHeaders() }).subscribe({
      next: () => this.fetchInventory(),
      error: () => {}
    });
  }

  addLoss(input: LossInput): Observable<unknown> {
    return this.http.post(`${this.API_URL}losses`, input, { headers: this.getAuthHeaders() }).pipe(
      tap({
        next: () => { this.fetchLosses(); this.fetchInventory(); }
      })
    );
  }

  removeLoss(id: string): void {
    this.http.delete(`${this.API_URL}losses/${id}`, { headers: this.getAuthHeaders() }).subscribe({
      next: () => { this.fetchLosses(); this.fetchInventory(); },
      error: () => {}
    });
  }

  addReminder(input: ReminderInput): void {
    const reminder: Reminder = {
      id: `local-${Date.now()}`,
      title: input.title,
      note: input.note?.trim() || undefined,
      scheduledAt: new Date(input.scheduledAt)
    };
    const next = [...this.remindersSubject.value, reminder].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    this.remindersSubject.next(next);
    this.persistReminders(next);
  }

  updateReminder(id: string, changes: ReminderInput): void {
    const next = this.remindersSubject.value
      .map(reminder => reminder.id === id
        ? { ...reminder, title: changes.title, scheduledAt: new Date(changes.scheduledAt), note: changes.note?.trim() || undefined }
        : reminder)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    this.remindersSubject.next(next);
    this.persistReminders(next);
  }

  removeReminder(id: string): void {
    const next = this.remindersSubject.value.filter(r => r.id !== id);
    this.remindersSubject.next(next);
    this.persistReminders(next);
  }

  private loadInitialReminders(): Reminder[] {
    const raw = localStorage.getItem(DataService.REMINDERS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw).map((r: any) => ({...r, scheduledAt: new Date(r.scheduledAt)}));
    } catch { return []; }
  }

  private persistReminders(data: Reminder[]) {
    localStorage.setItem(DataService.REMINDERS_STORAGE_KEY, JSON.stringify(data));
  }
}
