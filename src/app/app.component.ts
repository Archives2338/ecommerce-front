import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './shared/header/header.component';
import { HomeComponent } from './pages/home/home.component';
import { HeaderConfig } from './shared/header/header.component';
import { ContentService, HeaderContent, HomeContent } from './services/content.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    HomeComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'streaming-ecommerce';
  
  // Estado de carga
  isLoading = true;
  loadingError = false;
  
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

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    // Cargar todo el contenido de la página principal en una sola petición
    this.loadMainPageContent();
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
   * Actualiza los colores del header dinámicamente
   */
  updateHeaderColors(): void {
    // Aplicar colores CSS personalizados
    document.documentElement.style.setProperty('--header-bg-color', this.headerConfig.backgroundColor);
    document.documentElement.style.setProperty('--header-text-color', this.headerConfig.textColor);
  }

  /**
   * Simula login/logout
   */
  simulateLogin(): void {
    this.isLoggedIn = !this.isLoggedIn;
    if (this.isLoggedIn) {
      this.userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
    } else {
      this.userAvatar = '';
    }
  }

  /**
   * Muestra una notificación de prueba
   */
  showNotification(): void {
    // Esta funcionalidad se implementaría comunicándose con el HeaderComponent
    console.log('Mostrar notificación - implementar comunicación con HeaderComponent');
  }

  /**
   * Refresca el contenido del backend
   */
  refreshContent(): void {
    this.loadMainPageContent();
  }

  /**
   * Cambia el ancho del header
   */
  changeHeaderWidth(width: 'normal' | 'expanded' | 'full-width'): void {
    this.headerConfig = {
      ...this.headerConfig,
      headerWidth: width,
      maxWidth: width === 'normal' ? '1200px' : 
               width === 'expanded' ? '1600px' : 
               '100%'
    };
  }

  /**
   * Obtiene el texto del botón según el ancho actual
   */
  getWidthButtonText(): string {
    switch (this.headerConfig.headerWidth) {
      case 'normal':
        return 'Ancho: Normal (1200px)';
      case 'expanded':
        return 'Ancho: Expandido (1600px)';
      case 'full-width':
        return 'Ancho: Completo (100%)';
      default:
        return 'Ancho: Normal';
    }
  }

  /**
   * Obtiene ejemplo de la API para mostrar en la documentación
   */
  getApiExample(): string {
    return JSON.stringify({
      "code": 0,
      "message": "Listo",
      "toast": 0,
      "redirect_url": "",
      "type": "success",
      "data": {
        "head": {
          "head1": "PÁGINA DE INICIO",
          "head2": "AFILIATE", 
          "head3": "SOPORTE-POSTVENTA",
          "head4": "SUSCRIPCIÓN",
          "head5": "VENDENOS",
          "head6": "Buscar...",
          "head7": "No se encontraron resultados",
          "params": {
            "{affiliate_Big}": "AFFILIATE"
          }
        }
      }
    }, null, 2);
  }
}
