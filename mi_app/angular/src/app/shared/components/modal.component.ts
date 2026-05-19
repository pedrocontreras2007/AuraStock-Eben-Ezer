import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ModalConfig {
  mode: 'input' | 'confirm';
  title: string;
  message: string;
  inputValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  visible = false;
  error = '';
  config: ModalConfig = {
    mode: 'confirm',
    title: '',
    message: '',
    inputValue: '',
    placeholder: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  };
  inputValue = '';

  open(config: ModalConfig): void {
    this.config = { ...this.config, ...config };
    this.inputValue = config.inputValue ?? '';
    this.error = '';
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  onConfirm(): void {
    this.confirm.emit(this.inputValue);
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }
}
