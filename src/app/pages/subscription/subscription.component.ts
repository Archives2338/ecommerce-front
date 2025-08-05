import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, SubscriptionCard } from './card/card.component';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent {
  hasSubscriptions = true; // Flag para mostrar/ocultar el contenido
  
  // Datos mockeados para el card
  mockSubscriptions: SubscriptionCard[] = [
    {
      detail_logo: 'https://static.gamsgocdn.com/image/9dbae2d076a256112ab6e8e2f9b764f1.webp',
      nombre: 'Netflix Premium',
      fecha_inicio: '2024-01-15',
      fecha_cobro: '2024-02-15',
      correo: 'usuario@ejemplo.com',
      contrasena: 'password123'
    },
    {
      detail_logo: 'https://static.gamsgocdn.com/image/dd3ccaa4b722349e652071d2d3f55ef7.webp',
      nombre: 'Disney Plus',
      fecha_inicio: '2024-01-10',
      fecha_cobro: '2024-02-10',
      correo: 'usuario@ejemplo.com',
      contrasena: 'disney456'
    }
  ];

  // Tiempo restante mockeado
  tiempoRestante = '25 días 14 horas';

  // Método para alternar entre mostrar/ocultar las suscripciones (para pruebas)
  toggleSubscriptions() {
    this.hasSubscriptions = !this.hasSubscriptions;
  }

}
