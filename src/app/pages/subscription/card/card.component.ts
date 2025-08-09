
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";

export interface SubscriptionCard {
  id?: string; // ID único para trackBy
  detail_logo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_cobro: string;
  correo: string;
  contrasena: string;
  tiempoRestante: string; // Tiempo restante hasta la expiración
  expires_at: Date; // Fecha de expiración para cálculos
  // Agrega aquí cualquier otro campo que uses en el HTML
}

@Component({
  selector: 'app-subscription-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [CommonModule, MatIconModule]
})

export class CardComponent {
  @Input() card!: SubscriptionCard;
  @Input() tiempoRestante: string = '';
  @Input() countdownClass: string = 'tiempo-restante';
  showPassword = false;

  showPasswordMethod() {
    this.showPassword = !this.showPassword; // Toggle en lugar de solo true
  }

  hidePassword() {
    this.showPassword = false;
  }

  openModalCompartir() {
    // Lógica para abrir el modal de compartir
  }
}
