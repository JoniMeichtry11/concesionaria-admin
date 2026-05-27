import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';

interface UserRoleRow {
  id: string;
  role: 'admin' | 'vendedor';
  full_name: string | null;
  created_at: string;
}

@Component({
  selector: 'app-subscreen-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24">
      <!-- Header -->
      <header class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 z-10">
        <a routerLink="/settings" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 class="text-xl font-bold text-slate-800">Gestionar Vendedores</h1>
          <p class="text-xs text-slate-500">Invitá y administrá accesos al admin</p>
        </div>
      </header>

      <!-- Main Container -->
      <div class="max-w-md mx-auto p-4 flex flex-col gap-4">
        <!-- Messages -->
        <div *ngIf="error()" class="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-sm text-red-700 animate-fade-in">
          {{ error() }}
        </div>
        <div *ngIf="success()" class="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-sm text-emerald-700 animate-fade-in">
          {{ success() }}
        </div>

        <!-- Action Button -->
        <button (click)="openInviteModal()" class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invitar vendedor
        </button>

        <!-- Loader -->
        <div *ngIf="loading() && dbUsers().length === 0" class="flex flex-col items-center justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-500 mt-3">Cargando usuarios...</p>
        </div>

        <!-- Users List -->
        <div class="flex flex-col gap-3" *ngIf="!loading() || dbUsers().length > 0">
          <div *ngFor="let user of mergedUsers()" class="relative bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors">
            
            <div class="flex items-center gap-3">
              <!-- Avatar placeholder -->
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border border-slate-200">
                {{ getUserInitials(user) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-slate-800">{{ getUserDisplayName(user) }}</h3>
                  <!-- Badge current user -->
                  <span *ngIf="user.id === currentUserId()" class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                    Vos
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">{{ user.full_name }}</p>
              </div>
            </div>

            <!-- Role Badge & Action -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full" 
                    [ngClass]="user.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'">
                {{ user.role === 'admin' ? 'Admin' : 'Vendedor' }}
              </span>

              <!-- Context Menu Trigger (Only for sellers, not the admin themselves) -->
              <div class="relative" *ngIf="user.id !== currentUserId() && user.role !== 'admin'">
                <button (click)="toggleMenu(user.id)" class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 active:scale-90 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                <!-- Context Menu Dropdown -->
                <div *ngIf="activeMenuId() === user.id" class="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-20 animate-fade-in">
                  <button (click)="changeToAdmin(user)" class="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Cambiar a admin
                  </button>
                  <button (click)="confirmDeleteUser(user)" class="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar usuario
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div *ngIf="!loading() && mergedUsers().length === 0" class="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <p class="text-sm text-slate-500">No hay otros vendedores registrados.</p>
        </div>
      </div>

      <!-- Invite Modal (Dialog) -->
      <div *ngIf="showInviteDialog()" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-bold text-slate-800 mb-1">Invitar Vendedor</h2>
          <p class="text-xs text-slate-500 mb-4">Ingresá el email del vendedor. Recibirá un correo para configurar su acceso.</p>
          
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 mb-1">Correo electrónico</label>
              <input type="email" [(ngModel)]="inviteEmail" placeholder="vendedor@empresa.com" class="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-indigo-600" />
            </div>

            <div class="flex gap-3">
              <button (click)="inviteSeller()" [disabled]="loading()" class="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl active:scale-95 disabled:opacity-50 transition-all">
                {{ loading() ? 'Invitando...' : 'Enviar invitación' }}
              </button>
              <button (click)="closeInviteModal()" class="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl active:scale-95 transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Bottom Sheet -->
      <div *ngIf="showDeleteConfirm()" class="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-end justify-center z-50" (click)="showDeleteConfirm.set(false)">
        <div class="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5"></div>
          <h3 class="text-lg font-bold text-slate-800 text-center mb-2">¿Eliminar vendedor?</h3>
          <p class="text-sm text-slate-500 text-center mb-6 px-4">Esta acción revocará todos los accesos del vendedor a este panel de administración.</p>
          
          <div class="flex flex-col gap-3">
            <button (click)="deleteUser()" class="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl active:scale-95 transition-all">
              Eliminar
            </button>
            <button (click)="showDeleteConfirm.set(false)" class="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl active:scale-95 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-scale-in {
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class SubScreenUsuariosComponent {
  private supabaseService = inject(SupabaseService);
  authService = inject(AuthService);

  // States
  dbUsers = signal<UserRoleRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Modal and menu triggers
  showInviteDialog = signal(false);
  activeMenuId = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  
  // Selection
  inviteEmail = '';
  userToDelete = signal<UserRoleRow | null>(null);

  currentUserId = computed(() => this.authService.currentUser()?.id);
  currentUserEmail = computed(() => this.authService.currentUser()?.email);

  // Combina lista de la BD con el admin actual para garantizar su visualización
  mergedUsers = computed(() => {
    const list = this.dbUsers();
    const currId = this.currentUserId();
    const currEmail = this.currentUserEmail();

    if (!currId) return list;

    const exists = list.some(u => u.id === currId);
    if (exists) {
      return list;
    }

    return [
      {
        id: currId,
        role: 'admin' as const,
        full_name: currEmail || 'Admin',
        created_at: new Date().toISOString()
      },
      ...list
    ];
  });

  constructor() {
    this.loadUsers();
  }

  // Carga usuarios desde la base de datos
  async loadUsers() {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.dbUsers.set((data as UserRoleRow[]) || []);
    } catch (err: any) {
      console.error('Error al cargar vendedores:', err);
      this.error.set('No se pudo cargar la lista de vendedores.');
    } finally {
      this.loading.set(false);
    }
  }

  // Helper para mostrar display name
  getUserDisplayName(user: UserRoleRow): string {
    if (!user.full_name) return 'Vendedor';
    if (user.full_name.includes('@')) {
      const prefix = user.full_name.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return user.full_name;
  }

  getUserInitials(user: UserRoleRow): string {
    const name = this.getUserDisplayName(user);
    return name.slice(0, 2).toUpperCase();
  }

  toggleMenu(userId: string) {
    if (this.activeMenuId() === userId) {
      this.activeMenuId.set(null);
    } else {
      this.activeMenuId.set(userId);
    }
  }

  openInviteModal() {
    this.inviteEmail = '';
    this.error.set(null);
    this.success.set(null);
    this.showInviteDialog.set(true);
  }

  closeInviteModal() {
    this.showInviteDialog.set(false);
  }

  // Invitar vendedor usando supabase.auth.admin.inviteUserByEmail
  async inviteSeller() {
    const email = this.inviteEmail.trim();
    if (!email || !email.includes('@')) {
      this.error.set('Por favor, ingresá un correo electrónico válido.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      // 1. Enviar invitación por email en Supabase Auth
      const { data, error } = await this.supabaseService.client.auth.admin.inviteUserByEmail(email);
      
      if (error) {
        throw error;
      }

      if (!data || !data.user) {
        throw new Error('No se recibió la información del usuario invitado.');
      }

      // 2. Crear el rol 'vendedor' en la tabla user_roles
      const { error: roleError } = await (this.supabaseService.client
        .from('user_roles') as any)
        .insert({
          id: data.user.id,
          role: 'vendedor',
          full_name: email,
          created_at: new Date().toISOString()
        });

      if (roleError) {
        console.error('Error al insertar rol para el usuario invitado:', roleError);
        throw new Error(`Usuario invitado pero falló asignar su rol: ${roleError.message}`);
      }

      this.success.set(`Se envió la invitación por correo a ${email} correctamente.`);
      this.inviteEmail = '';
      this.showInviteDialog.set(false);
      await this.loadUsers();
    } catch (err: any) {
      console.error('Error en inviteSeller:', err);
      this.error.set(err.message || 'No se pudo enviar la invitación al vendedor.');
    } finally {
      this.loading.set(false);
    }
  }

  // Cambiar vendedor a Administrador
  async changeToAdmin(user: UserRoleRow) {
    this.activeMenuId.set(null);
    this.loading.set(true);
    this.error.set(null);
    try {
      const { error } = await (this.supabaseService.client
        .from('user_roles') as any)
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) throw error;
      this.success.set(`${this.getUserDisplayName(user)} ahora es Administrador.`);
      setTimeout(() => this.success.set(null), 3000);
      await this.loadUsers();
    } catch (err: any) {
      console.error('Error al cambiar a admin:', err);
      this.error.set('No se pudo cambiar el rol del vendedor.');
    } finally {
      this.loading.set(false);
    }
  }

  // Eliminar usuario
  confirmDeleteUser(user: UserRoleRow) {
    this.activeMenuId.set(null);
    this.userToDelete.set(user);
    this.showDeleteConfirm.set(true);
  }

  async deleteUser() {
    const user = this.userToDelete();
    if (!user) return;

    this.showDeleteConfirm.set(false);
    this.loading.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabaseService.client
        .from('user_roles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      this.success.set(`Se eliminó al vendedor ${this.getUserDisplayName(user)}.`);
      setTimeout(() => this.success.set(null), 3000);
      await this.loadUsers();
    } catch (err: any) {
      console.error('Error al eliminar vendedor:', err);
      this.error.set('No se pudo eliminar el vendedor de la base de datos.');
    } finally {
      this.loading.set(false);
    }
  }
}
