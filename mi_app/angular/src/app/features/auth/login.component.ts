import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, TenantInfo } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  tenants: TenantInfo[] = [];
  selectedTenant: TenantInfo | null = null;
  showPassword = false;
  submitting = false;
  errorMessage = '';
  loadingTenants = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async ngOnInit() {
    this.tenants = await this.auth.getTenants();
    this.loadingTenants = false;
  }

  selectTenant(tenant: TenantInfo) {
    this.selectedTenant = tenant;
    this.errorMessage = '';
  }

  back() {
    this.selectedTenant = null;
    this.errorMessage = '';
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.submitting = false;

    if (result.success) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    this.errorMessage = result.error || 'Credenciales inválidas';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get emailControl() { return this.form.controls.email; }
  get passwordControl() { return this.form.controls.password; }
}
