import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Subject, takeUntil } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartData } from 'chart.js';
import { DataService } from '../../core/services/data.service';
import { Production } from '../../core/models/harvest.model';
import { InventoryItem, parseQuantity } from '../../core/models/inventory-item.model';
import { Reminder } from '../../core/models/reminder.model';
import { Loss } from '../../core/models/loss.model';
import { QuantityFormatPipe } from '../../shared/pipes/quantity-format.pipe';

interface DashboardSummary {
  readonly totalProduction: number;
  readonly totalProductionQuantity: number;
  readonly totalLossQuantityThisMonth: number;
  readonly inventoryCount: number;
  readonly healthyInventory: number;
  readonly criticalItems: InventoryItem[];
  readonly zeroStockItems: InventoryItem[];
  readonly recentProduction: { productName: string; date: Date; quantity: number; category: string }[];
  readonly stockByCategory: { category: string; total: number }[];
  readonly maxCategoryTotal: number;
  readonly topInventoryItems: InventoryItem[];
}

interface DashboardAction {
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
  readonly path: string;
  readonly accent: 'primary' | 'secondary' | 'warning' | 'info';
}

interface CalendarDay {
  readonly date: Date;
  readonly isoDate: string;
  readonly label: number;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly reminders: Reminder[];
}

interface CalendarViewModel {
  readonly monthLabel: string;
  readonly todayLabel: string;
  readonly weeks: CalendarDay[][];
  readonly upcomingReminders: Reminder[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, QuantityFormatPipe, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private static readonly ACTIONS: DashboardAction[] = [
    { icon: 'compost', title: 'Producción', subtitle: 'Registra lotes y entradas', path: '/produccion', accent: 'primary' },
    { icon: 'inventory_2', title: 'Inventario', subtitle: 'Gestiona insumos y existencias', path: '/inventario', accent: 'secondary' },
    { icon: 'warning', title: 'Alertas', subtitle: 'Identifica productos críticos', path: '/alertas', accent: 'warning' },
    { icon: 'insights', title: 'Reportes', subtitle: 'Analiza el inventario', path: '/reportes', accent: 'info' }
  ];

  readonly actions = DashboardComponent.ACTIONS;
  readonly weekDayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  readonly Math = Math;
  editingReminderId: string | null = null;

  readonly categoryLabels: Record<string, string> = {
    insumo: 'Insumos', relleno: 'Rellenos', empaque: 'Empaques', utensilio: 'Utensilios', otro: 'Otros'
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true, intersect: false, mode: 'index', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 10, cornerRadius: 8 }
    },
    animation: { duration: 1500, easing: 'easeOutQuart' },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(226, 232, 240, 0.6)' } }, x: { grid: { display: false } } }
  };
  public barChartData: ChartData<'bar'> | undefined;

  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'right', labels: { usePointStyle: true, padding: 20 } },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8 }
    },
    cutout: '70%',
    animation: { animateScale: true, animateRotate: true, duration: 1000 }
  };
  public doughnutChartData: ChartData<'doughnut'> | undefined;

  private readonly currentMonthSubject = new BehaviorSubject<Date>(this.startOfMonth(new Date()));
  private readonly currentMonth$ = this.currentMonthSubject.asObservable();

  readonly reminderForm = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    date: this.fb.nonNullable.control(this.toISODate(new Date()), [Validators.required]),
    time: this.fb.control('', [Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]),
    note: this.fb.control('', [Validators.maxLength(250)])
  });

  readonly calendarVm$ = combineLatest([this.currentMonth$, this.data.reminders$]).pipe(
    map(([month, reminders]) => this.buildCalendar(month, reminders))
  );

  readonly summary$ = combineLatest([this.data.production$, this.data.inventory$, this.data.losses$]).pipe(
    map(([production, inventory, losses]: [Production[], InventoryItem[], Loss[]]) => {
      const currentMonthIndex = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const totalLossQuantityThisMonth = losses
        .filter(l => l.date.getMonth() === currentMonthIndex && l.date.getFullYear() === currentYear)
        .reduce((sum, l) => sum + l.quantity, 0);

      const criticalItems = inventory
        .filter((item: InventoryItem) => { const q = parseQuantity(item.quantity); return q > 0 && q <= (item.criticalStock ?? 5); })
        .sort((a: InventoryItem, b: InventoryItem) => parseQuantity(a.quantity) - parseQuantity(b.quantity));

      const zeroStockItems = inventory
        .filter((item: InventoryItem) => parseQuantity(item.quantity) === 0);

      const recentProduction = production
        .slice(0, 3)
        .map((p: Production) => ({
          productName: p.productName, date: p.date, quantity: p.quantity, category: p.category
        }));

      const stockByCategoryMap = inventory.reduce((acc, item: InventoryItem) => {
        const current = acc.get(item.category) ?? 0;
        acc.set(item.category, current + parseQuantity(item.quantity));
        return acc;
      }, new Map<string, number>());

      const stockByCategory = Array.from(stockByCategoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const maxCategoryTotal = stockByCategory.reduce((max, stat) => Math.max(max, stat.total), 0);

      const topInventoryItems = [...inventory]
        .sort((a: InventoryItem, b: InventoryItem) => parseQuantity(b.quantity) - parseQuantity(a.quantity))
        .slice(0, 5);

      return {
        totalProduction: production.length,
        totalProductionQuantity: production.reduce((sum: number, p: Production) => sum + p.quantity, 0),
        totalLossQuantityThisMonth,
        inventoryCount: inventory.length,
        healthyInventory: inventory.filter((item: InventoryItem) => parseQuantity(item.quantity) > (item.criticalStock ?? 5)).length,
        criticalItems,
        zeroStockItems,
        recentProduction,
        stockByCategory,
        maxCategoryTotal,
        topInventoryItems
      } satisfies DashboardSummary;
    })
  );

  constructor(private readonly data: DataService, private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    combineLatest([this.data.production$, this.data.losses$, this.data.inventory$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      ([production, losses, inventory]) => {
        const last6Months: string[] = [];
        const prodData: number[] = [];
        const lossesData: number[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d);
          last6Months.push(this.capitalize(monthName));

          const targetMonth = d.getMonth();
          const targetYear = d.getFullYear();

          const pSum = production
            .filter(p => p.date.getMonth() === targetMonth && p.date.getFullYear() === targetYear)
            .reduce((sum, p) => sum + p.quantity, 0);

          const lSum = losses
            .filter(l => l.date.getMonth() === targetMonth && l.date.getFullYear() === targetYear)
            .reduce((sum, l) => sum + l.quantity, 0);

          prodData.push(pSum);
          lossesData.push(lSum);
        }

        this.barChartData = {
          labels: last6Months,
          datasets: [
            { data: prodData, label: 'Producción', backgroundColor: 'rgba(46, 125, 50, 0.8)', hoverBackgroundColor: 'rgba(46, 125, 50, 1)', borderRadius: 6, barPercentage: 0.6 },
            { data: lossesData, label: 'Mermas', backgroundColor: 'rgba(211, 47, 47, 0.8)', hoverBackgroundColor: 'rgba(211, 47, 47, 1)', borderRadius: 6, barPercentage: 0.6 }
          ]
        };

        const enStock = inventory.filter(i => parseQuantity(i.quantity) > (i.criticalStock ?? 5)).length;
        const bajoStock = inventory.filter(i => { const q = parseQuantity(i.quantity); return q > 0 && q <= (i.criticalStock ?? 5); }).length;
        const agotado = inventory.filter(i => parseQuantity(i.quantity) === 0).length;

        this.doughnutChartData = {
          labels: ['En stock', 'Bajo stock', 'Agotado'],
          datasets: [{
            data: [enStock, bajoStock, agotado],
            backgroundColor: ['rgba(46, 125, 50, 0.85)', 'rgba(255, 152, 0, 0.85)', 'rgba(211, 47, 47, 0.85)'],
            hoverBackgroundColor: ['rgba(46, 125, 50, 1)', 'rgba(255, 152, 0, 1)', 'rgba(211, 47, 47, 1)'],
            borderWidth: 3, borderColor: '#ffffff', hoverOffset: 6
          }]
        };
      }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackInventory(_: number, item: InventoryItem): string { return item.id; }
  trackCategory(_: number, cat: { category: string; total: number }): string { return cat.category; }

  goToPreviousMonth(): void { this.shiftMonth(-1); }
  goToNextMonth(): void { this.shiftMonth(1); }

  selectDate(day: CalendarDay): void {
    this.reminderForm.controls.date.setValue(day.isoDate);
    if (!day.inCurrentMonth) this.currentMonthSubject.next(this.startOfMonth(day.date));
  }

  submitReminder(): void {
    if (this.reminderForm.invalid) { this.reminderForm.markAllAsTouched(); return; }
    const raw = this.reminderForm.getRawValue();
    const title = raw.title.trim();
    if (!title) { this.reminderForm.controls.title.setErrors({ required: true }); return; }
    const scheduledAt = this.parseReminderDate(raw.date, raw.time);
    if (!scheduledAt) { this.reminderForm.controls.date.setErrors({ invalid: true }); return; }

    if (this.editingReminderId) {
      this.data.updateReminder(this.editingReminderId, { title, scheduledAt, note: raw.note?.trim() || undefined });
    } else {
      this.data.addReminder({ title, scheduledAt, note: raw.note?.trim() || undefined });
    }
    this.reminderForm.reset({ title: '', date: this.toISODate(scheduledAt), time: '', note: '' });
    this.editingReminderId = null;
  }

  startReminderEdit(reminder: Reminder): void {
    this.editingReminderId = reminder.id;
    this.reminderForm.setValue({ title: reminder.title, date: this.toISODate(reminder.scheduledAt), time: this.formatTime(reminder.scheduledAt), note: reminder.note ?? '' });
  }

  cancelReminderEdit(): void {
    this.editingReminderId = null;
    this.reminderForm.reset({ title: '', date: this.reminderForm.controls.date.value || this.toISODate(new Date()), time: '', note: '' });
  }

  deleteReminder(reminder: Reminder): void {
    this.data.removeReminder(reminder.id);
    if (this.editingReminderId === reminder.id) this.cancelReminderEdit();
  }

  trackCalendarDay(_: number, day: CalendarDay): string { return day.isoDate; }
  trackReminder(_: number, reminder: Reminder): string { return reminder.id; }

  private shiftMonth(step: number): void {
    const current = this.currentMonthSubject.value;
    const next = new Date(current);
    next.setMonth(next.getMonth() + step);
    this.currentMonthSubject.next(this.startOfMonth(next));
  }

  private buildCalendar(month: Date, reminders: Reminder[]): CalendarViewModel {
    const today = this.startOfDay(new Date());
    const monthStart = this.startOfMonth(month);
    const firstVisibleDay = this.startOfWeek(monthStart);
    const remindersByDay = this.groupRemindersByDay(reminders);
    const weeks: CalendarDay[][] = [];
    let cursor = new Date(firstVisibleDay);

    for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
      const week: CalendarDay[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const dayDate = new Date(cursor);
        const isoDate = this.toISODate(dayDate);
        week.push({ date: dayDate, isoDate, label: dayDate.getDate(), inCurrentMonth: dayDate.getMonth() === monthStart.getMonth(), isToday: this.isSameDate(dayDate, today), reminders: remindersByDay.get(isoDate) ?? [] });
        cursor = this.addDays(cursor, 1);
      }
      weeks.push(week);
    }

    return {
      monthLabel: this.capitalize(new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(monthStart)),
      todayLabel: this.capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(today)),
      weeks,
      upcomingReminders: reminders.filter(r => this.startOfDay(r.scheduledAt).getTime() >= today.getTime()).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()).slice(0, 8)
    };
  }

  private groupRemindersByDay(reminders: Reminder[]): Map<string, Reminder[]> {
    const map = new Map<string, Reminder[]>();
    reminders.forEach(r => {
      const key = this.toISODate(r.scheduledAt);
      const collection = map.get(key) ?? [];
      collection.push(r);
      collection.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      map.set(key, collection);
    });
    return map;
  }

  private toISODate(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  }

  private startOfMonth(date: Date): Date { const c = new Date(date); c.setDate(1); c.setHours(0,0,0,0); return c; }
  private startOfDay(date: Date): Date { const c = new Date(date); c.setHours(0,0,0,0); return c; }
  private startOfWeek(date: Date): Date { const c = this.startOfDay(date); const d = c.getDay(); c.setDate(c.getDate() - ((d+6)%7)); return c; }
  private addDays(date: Date, amount: number): Date { const c = new Date(date); c.setDate(c.getDate()+amount); return c; }
  private isSameDate(a: Date, b: Date): boolean { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  private capitalize(value: string): string { if (!value) return value; return value.charAt(0).toUpperCase()+value.slice(1); }
  private parseReminderDate(date: string, time?: string | null): Date | null {
    if (!date) return null;
    const [y,m,d] = date.split('-').map(Number);
    if ([y,m,d].some(isNaN) || m<1||m>12||d<1||d>31) return null;
    let h=9, min=0;
    if (time?.includes(':')) { const [hs, ms] = time.split(':').map(Number); h=hs; min=ms; }
    return new Date(y, m-1, d, h, min, 0, 0);
  }
}
