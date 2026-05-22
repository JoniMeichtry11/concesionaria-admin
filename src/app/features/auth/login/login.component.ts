import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);
  private router = inject(Router);

  // Estados: 'form' | 'biometric' | 'offer_passkey'
  readonly loginState = signal<'form' | 'biometric' | 'offer_passkey'>('form');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.checkInitialState();
  }

  private async checkInitialState() {
    await this.authService.initialized;

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    if (this.authService.canUnlockWithBiometrics()) {
      this.loginState.set('biometric');
    } else {
      this.loginState.set('form');
    }
  }

  async onPasswordLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.signIn(email!, password!);

      // Ofrecer registrar biometría si el dispositivo lo soporta y no está registrada aún
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isAvailable && !this.authService.canUnlockWithBiometrics()) {
            this.loginState.set('offer_passkey');
            return;
          }
        } catch (e) {
          console.warn('Error al verificar disponibilidad de plataforma biométrica:', e);
        }
      }

      // Redirigir a Home
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onBiometricUnlock() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.unlockWithPasskey();
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error de autenticación biométrica');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegisterPasskey() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await this.authService.registerPasskey();
      this.successMessage.set('¡Acceso biométrico registrado con éxito!');
      
      // Esperamos 1.5 segundos para mostrar el mensaje de éxito antes de redirigir
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'No se pudo registrar la biometría.');
      
      // A pesar del fallo en registrar el acceso rápido, el login fue exitoso,
      // por lo tanto redirigimos a home después de 2 segundos.
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    } finally {
      this.isLoading.set(false);
    }
  }

  skipPasskeyRegistration() {
    this.router.navigate(['/']);
  }

  switchToPassword() {
    this.loginState.set('form');
  }

  switchToBiometric() {
    if (this.authService.canUnlockWithBiometrics()) {
      this.loginState.set('biometric');
    }
  }
}
