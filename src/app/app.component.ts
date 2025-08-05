import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { HomeComponent } from './pages/home/home.component';
import { HeaderConfig } from './shared/header/header.component';
import { ContentService, HeaderContent, HomeContent } from './services/content.service';
import { AuthService } from './services/auth.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'streaming-ecommerce';
  
  // Subject para manejar la destrucción del componente
  private destroy$ = new Subject<void>();
  
  // Estado de carga
  isLoading = true;
  loadingError = false;
  
  // Estado de ruta
  isAuthRoute = false;
  
  // Contenido cargado del backend
  headerContent: HeaderContent = {};
  homeContent: HomeContent = {};

  // Configuración del header
  headerConfig: HeaderConfig = {
    backgroundColor: '#ef5350',
    textColor: '#ffffff',
    showSearch: true,
    showLanguageSelector: true,
    showPromotion: false,
    promotionText: '🎉 Oferta especial - 50% de descuento en streaming',
    affiliateLink: 'https://example.com/affiliate',
    supportLink: 'https://example.com/support',
    headerWidth: 'normal', // Puede ser 'normal', 'expanded', 'full-width'
    maxWidth: '1200px'
  };

  // Estado del usuario
  userAvatar: string = '';
  isLoggedIn: boolean = false;
  showPromotion: boolean = false;

  constructor(
    private contentService: ContentService,
    private router: Router,
    private authService: AuthService
  ) {
    // Detectar la ruta inicial
    this.isAuthRoute = this.router.url.includes('/auth');
    
    // Detectar cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isAuthRoute = event.url.includes('/auth');
    });
  }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación del AuthService
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.isLoggedIn = !!user;
      console.log('Estado de autenticación actualizado:', this.isLoggedIn, user);
    });

    // Si tienes avatar guardado, puedes cargarlo aquí
    const avatar = localStorage.getItem('user_avatar');
    if (avatar) {
      this.userAvatar = avatar;
    }
    // Cargar todo el contenido de la página principal en una sola petición
    this.loadMainPageContent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  /**
   * Llamar esto después de login exitoso para actualizar el estado global
   */
  setLoggedInState(token: string, avatar?: string): void {
    localStorage.setItem('token', token);
    this.isLoggedIn = true;
    if (avatar) {
      localStorage.setItem('user_avatar', avatar);
      this.userAvatar = avatar;
    }
  }

  /**
   * Carga todo el contenido de la página principal en una sola petición (head + home)
   */
  loadMainPageContent(): void {
    this.isLoading = true;
    this.loadingError = false;
    
    this.contentService.getMainPageContent('es').subscribe({
      next: (content) => {
        console.log('Contenido de la página principal cargado:', content);
        this.headerContent = content.head;
        this.homeContent = content.home;
        this.isLoading = false;
        this.loadingError = false;
      },
      error: (error) => {
        console.error('Error al cargar contenido de la página principal:', error);
        this.isLoading = false;
        this.loadingError = true;
        
        // Usar contenido de fallback en caso de error
        this.headerContent = {
          head1: 'PÁGINA DE INICIO',
          head2: 'AFILIATE', 
          head3: 'SOPORTE-POSTVENTA',
          head4: 'SUSCRIPCIÓN',
          head5: 'CONTACTO',
          head6: 'Buscar...',
          head7: 'MI CUENTA'
        };
        
        this.homeContent = {
          home1: 'Proporcionando streaming asequible y de alta calidad durante 6 años',
          home2: 'Disfruta de tus servicios favoritos al mejor precio',
          home3: '250,000+',
          home4: '6',
          home5: '500,000+',
          home6: 'años de experiencia'
        };
      }
    });
  }

  /**
   * Refresca el contenido del backend
   */
  refreshContent(): void {
    this.loadMainPageContent();
  }
}
