# 🎯 Streaming E-Commerce - Header Dinámico

Un proyecto Angular avanzado con header customizable que se conecta dinámicamente al backend NestJS para obtener contenido multiidioma.

## ✨ Características Principales

### 🌐 Header Dinámico
- **Contenido del Backend**: Textos del header se cargan desde el backend NestJS
- **Multi-idioma**: Soporte para español e inglés con cambio en tiempo real
- **Completamente Customizable**: Colores, textos, enlaces configurables
- **Responsive**: Diseño adaptable para móviles y desktop

### 🎨 Customización Avanzada
- **Colores Dinámicos**: Cambio de colores en tiempo real
- **Elementos Opcionales**: Buscador, selector de idioma, promociones
- **Notificaciones**: Sistema de notificaciones con diferentes tipos
- **Modo Oscuro**: Soporte automático para modo oscuro

### 🔗 Integración con Backend
- **API REST**: Conexión con backend NestJS de e-commerce-metele
- **Contenido Dinámico**: Textos parametrizados con reemplazos automáticos
- **Cache Inteligente**: Sistema de cache para optimizar rendimiento
- **Fallback**: Contenido por defecto si el backend no está disponible

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js 18+ 
Angular CLI 19+
Backend NestJS corriendo en localhost:3000
```

### Instalación
```bash
# Clonar el proyecto
cd ecommerce-streaming/streaming-ecommerce

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
ng serve
```

### Configuración del Backend
Asegúrate de que el backend NestJS esté corriendo:
```bash
cd e-commerce-metele/nestjs-ecommerce-backend
npm run start:dev
```

## 🛠️ Uso del Header Component

### Uso Básico
```typescript
import { HeaderComponent } from './shared/header/header.component';

@Component({
  template: `
    <app-header 
      [headerConfig]="headerConfig"
      [isLoggedIn]="isLoggedIn"
      [userAvatar]="userAvatar">
    </app-header>
  `
})
export class MyComponent {
  headerConfig = {
    backgroundColor: '#ef5350',
    textColor: '#ffffff',
    showSearch: true,
    showLanguageSelector: true,
    // ... más configuraciones
  };
}
```

### Configuración Avanzada
```typescript
export interface HeaderConfig {
  backgroundColor: string;        // Color de fondo del header
  textColor: string;             // Color del texto
  showSearch: boolean;           // Mostrar buscador
  showLanguageSelector: boolean; // Mostrar selector de idioma
  showPromotion: boolean;        // Mostrar banner promocional
  promotionText: string;         // Texto de la promoción
  affiliateLink: string;         // Link de afiliados
  supportLink: string;           // Link de soporte
}
```

## 📡 API Backend

### Endpoint Principal
```
POST http://localhost:3000/api/webpage/key
```

### Payload
```json
{
  "key": ["head1", "head2", "head3", "head4", "head5", "head6", "head7"],
  "language": "es"
}
```

### Respuesta Esperada
```json
{
  "code": 0,
  "message": "Listo",
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
}
```

## 🎛️ Panel de Control

El proyecto incluye un panel de control interactivo que permite:

- ✅ Cambiar colores del header en tiempo real
- ✅ Activar/desactivar elementos del header
- ✅ Simular login/logout
- ✅ Mostrar notificaciones de prueba
- ✅ Refrescar contenido del backend
- ✅ Configurar texto promocional

## 🌍 Multi-idioma

### Idiomas Soportados
- 🇪🇸 Español (es)
- 🇺🇸 Inglés (en)

### Cambio de Idioma
```typescript
// Cambiar idioma programáticamente
this.contentService.changeLanguage('en');

// El header se actualiza automáticamente
```

## 📱 Responsive Design

El header está optimizado para:
- 📱 **Móviles**: Elementos se ocultan automáticamente
- 💻 **Tablets**: Layout adaptativo
- 🖥️ **Desktop**: Funcionalidad completa

### Breakpoints
```scss
// Móviles
@media (max-width: 768px) {
  // Ocultar buscador y selector de idioma
  .search-container, .language-selector {
    display: none !important;
  }
}

// Desktop
@media (min-width: 769px) {
  .d-md-flex {
    display: flex !important;
  }
}
```

## 🎨 Customización de Estilos

### Variables CSS
```css
:root {
  --header-bg-color: #ef5350;
  --header-text-color: #ffffff;
  --header-height: 72px;
  --header-padding: 0 20px;
}
```

### Temas Personalizados
```typescript
// Tema oscuro
updateHeaderConfig({
  backgroundColor: '#2c3e50',
  textColor: '#ecf0f1'
});

// Tema claro
updateHeaderConfig({
  backgroundColor: '#ffffff',
  textColor: '#2d3748'
});
```

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones
```typescript
// Información
showCustomNotification('Contenido actualizado', 'info');

// Éxito
showCustomNotification('Guardado correctamente', 'success');

// Advertencia
showCustomNotification('Verificar datos', 'warning');

// Error
showCustomNotification('Error de conexión', 'error');
```

## 🛡️ Seguridad y Performance

### Características de Seguridad
- ✅ Sanitización de contenido HTML
- ✅ Validación de parámetros
- ✅ CORS configurado correctamente
- ✅ Headers de seguridad

### Optimizaciones de Performance
- ✅ Cache de contenido
- ✅ Lazy loading de componentes
- ✅ Debounce en búsquedas
- ✅ Compresión de assets

## 🧪 Testing

```bash
# Tests unitarios
ng test

# Tests e2e
ng e2e

# Coverage
ng test --code-coverage
```

## 🚀 Deployment

### Build de Producción
```bash
ng build --prod
```

### Variables de Entorno
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.com/api'
};
```

## 📝 Estructura del Proyecto

```
src/
├── app/
│   ├── services/
│   │   └── content.service.ts        # Servicio para conectar con backend
│   ├── shared/
│   │   └── header/                   # Componente header
│   │       ├── header.component.ts
│   │       ├── header.component.html
│   │       └── header.component.scss
│   ├── app.component.ts              # Componente principal
│   └── app.config.ts                 # Configuración de la app
├── assets/
│   └── svg/
│       └── logos/
│           └── logo1.svg             # Logo de la aplicación
└── environments/                     # Variables de entorno
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Verifica que el backend esté corriendo en `localhost:3000`
3. Revisa la consola del navegador para errores
4. Verifica la conexión de red

## 🔮 Roadmap

### Próximas Características
- [ ] **Editor Visual**: Panel para editar contenido del header
- [ ] **Temas Predefinidos**: Biblioteca de temas listos para usar
- [ ] **Animaciones**: Transiciones suaves entre cambios
- [ ] **PWA Support**: Funcionalidad offline
- [ ] **Analytics**: Métricas de uso del header
- [ ] **A/B Testing**: Pruebas de diferentes versiones

---

¡Gracias por usar Streaming E-Commerce Header Dinámico! 🎉
