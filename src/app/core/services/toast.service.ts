import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /** Señal reactiva con todos los toasts activos */
  readonly toasts = signal<Toast[]>([]);

  /**
   * Muestra un toast y lo remueve automáticamente después de 3 segundos.
   */
  show(message: string, type: 'success' | 'error' = 'success'): void {
    const id = Date.now() + Math.random();
    this.toasts.update((all) => [...all, { id, message, type }]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  /**
   * Remueve un toast específico por su ID.
   */
  remove(id: number): void {
    this.toasts.update((all) => all.filter((t) => t.id !== id));
  }
}
