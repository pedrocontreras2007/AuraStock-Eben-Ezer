import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastConfig {
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" [class.toast--visible]="visible" [class.toast--success]="config.type === 'success'" [class.toast--error]="config.type === 'error'">
      <span class="material-symbols-outlined">{{ config.type === 'success' ? 'check_circle' : 'error' }}</span>
      <span>{{ config.message }}</span>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 2000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      white-space: nowrap;
    }
    .toast--visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }
    .toast--success {
      background: #1b5e20;
      color: #fff;
    }
    .toast--error {
      background: #b71c1c;
      color: #fff;
    }
    .toast .material-symbols-outlined {
      font-size: 1.25rem;
    }
  `]
})
export class ToastComponent {
  visible = false;
  config: ToastConfig = { message: '', type: 'success' };
  private timer: any;

  show(config: ToastConfig): void {
    clearTimeout(this.timer);
    this.config = config;
    this.visible = true;
    this.timer = setTimeout(() => this.visible = false, config.duration ?? 3000);
  }
}
