import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { SubscriptionComponent } from './pages/subscription/subscription.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { OrderComponent } from './pages/order/order.component';
export const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },

  {
    path: 'subscription',
    component: SubscriptionComponent,
    canActivate: [AuthGuard] // Protege la ruta de suscripción
  },
  {
    path: 'order',
    component: OrderComponent, // Assuming OrderComponent is similar to SubscriptionComponent
    canActivate: [AuthGuard] // Uncomment if you want to protect this route as well
  },
  {
    path: '**',
    redirectTo: ''

  }
];
