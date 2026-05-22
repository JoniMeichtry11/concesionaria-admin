import { Injectable, inject, signal, computed } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabaseService = inject(SupabaseService);

  readonly currentUser = signal<User | null>(null);
  readonly userRole = signal<'admin' | 'vendedor' | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());

  private tempPassword: string | null = null;

  private initResolve!: () => void;
  readonly initialized = new Promise<void>((resolve) => {
    this.initResolve = resolve;
  });

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const { data: { session }, error } = await this.supabaseService.client.auth.getSession();
      if (error) {
        console.error('Error al restaurar sesión:', error);
      }

      if (session?.user) {
        this.currentUser.set(session.user);
        await this.fetchUserRole(session.user.id);
      }
    } finally {
      this.initResolve();
    }

    // Escuchar cambios en el estado de autenticación
    this.supabaseService.client.auth.onAuthStateChange(async (event, currentSession) => {
      const user = currentSession?.user || null;
      this.currentUser.set(user);

      if (user) {
        await this.fetchUserRole(user.id);
      } else {
        this.userRole.set(null);
      }
    });
  }

  private async fetchUserRole(userId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('user_roles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error al obtener rol del usuario:', error);
        this.userRole.set('vendedor'); // Valor por defecto
        return;
      }

      this.userRole.set(((data as any)?.role as 'admin' | 'vendedor') || null);
    } catch (err) {
      console.error('Error inesperado al obtener rol del usuario:', err);
      this.userRole.set('vendedor');
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let userMessage = 'Error al iniciar sesión. Por favor, verificá tus datos.';
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Email o contraseña incorrectos.';
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'El email no ha sido confirmado.';
      } else if (error.message.includes('Network connection lost')) {
        userMessage = 'Error de conexión. Verificá tu conexión a internet.';
      }
      throw new Error(userMessage);
    }

    if (data.user) {
      this.currentUser.set(data.user);
      this.tempPassword = password;
      await this.fetchUserRole(data.user.id);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) throw error;

    this.currentUser.set(null);
    this.userRole.set(null);
    this.tempPassword = null;

    // Limpiamos los datos biométricos locales por seguridad
    localStorage.removeItem('auth_has_biometrics');
    localStorage.removeItem('auth_biometric_user');
    localStorage.removeItem('auth_biometric_cred');
  }

  canUnlockWithBiometrics(): boolean {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
    return localStorage.getItem('auth_has_biometrics') === 'true';
  }

  async registerPasskey(): Promise<void> {
    const user = this.currentUser();
    if (!user || !user.email) {
      throw new Error('No hay una sesión activa para registrar datos biométricos.');
    }

    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      throw new Error('Este dispositivo o navegador no soporta autenticación biométrica.');
    }

    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      throw new Error('El autenticador biométrico no está disponible o configurado en este dispositivo.');
    }

    const email = user.email;
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const rpId = window.location.hostname;

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Concesionaria Admin PWA',
        id: rpId,
      },
      user: {
        id: userId,
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 },  // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      timeout: 60000,
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: creationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No se pudo crear la credencial biométrica.');
      }

      // Guardar el estado de biometría registrada y las credenciales de respaldo
      localStorage.setItem('auth_has_biometrics', 'true');
      localStorage.setItem('auth_biometric_user', email);
      
      if (this.tempPassword) {
        localStorage.setItem('auth_biometric_cred', btoa(JSON.stringify({
          email,
          password: this.tempPassword,
        })));
        this.tempPassword = null;
      }
    } catch (err: any) {
      console.error('Error al registrar WebAuthn:', err);
      throw new Error(err.message || 'Error al registrar biometría.');
    }
  }

  async unlockWithPasskey(): Promise<void> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      throw new Error('Este dispositivo o navegador no soporta autenticación biométrica.');
    }

    const hasBiometrics = localStorage.getItem('auth_has_biometrics') === 'true';
    const email = localStorage.getItem('auth_biometric_user');
    const credentialData = localStorage.getItem('auth_biometric_cred');

    if (!hasBiometrics || !email || !credentialData) {
      throw new Error('No hay credenciales biométricas registradas en este dispositivo.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rpId = window.location.hostname;

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId,
      userVerification: 'required',
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: requestOptions,
      });

      if (!assertion) {
        throw new Error('Verificación biométrica cancelada.');
      }

      // Desencriptar / recuperar credenciales guardadas
      const decoded = JSON.parse(atob(credentialData));
      await this.signIn(decoded.email, decoded.password);
    } catch (err: any) {
      console.error('Error al verificar biometría:', err);
      throw new Error(err.message || 'Error al verificar biometría.');
    }
  }
}
