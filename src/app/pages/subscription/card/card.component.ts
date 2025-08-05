
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";

export interface SubscriptionCard {
  detail_logo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_cobro: string;
  correo: string;
  contrasena: string;
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
  showPassword = false;

  showPasswordMethod() {
    this.showPassword = true;
  }

  openModalCompartir() {
    // Lógica para abrir el modal de compartir
  }
}
