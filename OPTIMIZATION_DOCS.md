# Optimización de Peticiones - Una Sola Request para Head + Home

## Cambios Realizados

### 1. ContentService - Nuevo Método `getMainPageContent()`

Se agregó un nuevo método al `ContentService` que obtiene tanto el contenido del header como del home en una sola petición:

```typescript
getMainPageContent(language: string = 'es'): Observable<{head: HeaderContent, home: HomeContent}>
```

**Request al Backend:**
```json
{
  "key": ["head", "home"],
  "language": "es"
}
```

**Response Esperada:**
```json
{
  "code": 0,
  "message": "Listo",
  "data": {
    "head": {
      "head1": "PÁGINA DE INICIO",
      "head2": "AFILIATE",
      // ... más contenido del header
    },
    "home": {
      "home1": "Título principal",
      "home2": "Subtítulo",
      // ... más contenido del home
    }
  }
}
```

### 2. AppComponent - Gestión Centralizada de Carga

El `AppComponent` ahora:

- Hace **UNA SOLA** petición para cargar todo el contenido de la página principal
- Maneja los estados de carga y error centralizadamente
- Pasa el contenido precargado a los componentes hijo

```typescript
// En ngOnInit
this.loadMainPageContent();

// Método que hace la petición única
loadMainPageContent(): void {
  this.contentService.getMainPageContent('es').subscribe({
    next: (content) => {
      this.headerContent = content.head;
      this.homeContent = content.home;
      this.isLoading = false;
    },
    error: (error) => {
      // Manejo de errores con fallback
    }
  });
}
```

### 3. HeaderComponent - Input para Contenido Precargado

Se agregó el input `@Input() preloadedContent`:

```typescript
@Input() preloadedContent: HeaderContent | null = null;

ngOnInit(): void {
  if (this.preloadedContent) {
    this.processPreloadedContent(this.preloadedContent);
  } else {
    this.loadHeaderContent(); // Fallback
  }
}
```

### 4. HomeComponent - Input para Contenido Precargado

Similar al HeaderComponent:

```typescript
@Input() preloadedContent: HomeContent | null = null;

ngOnInit(): void {
  if (this.preloadedContent) {
    this.processPreloadedContent(this.preloadedContent);
  } else {
    this.loadHomeContent(); // Fallback
  }
}
```

### 5. Template HTML Actualizado

```html
<!-- Estados de carga -->
<div *ngIf="isLoading">Cargando contenido...</div>
<div *ngIf="loadingError">Error al cargar. <button (click)="refreshContent()">Reintentar</button></div>

<!-- Contenido con datos precargados -->
<div *ngIf="!isLoading">
  <app-header [preloadedContent]="headerContent"></app-header>
  <app-home [preloadedContent]="homeContent"></app-home>
</div>
```

## Beneficios

### ✅ **Rendimiento Mejorado**
- **Antes:** 2 peticiones HTTP separadas (header + home)
- **Ahora:** 1 sola petición HTTP que obtiene ambos

### ✅ **Mejor Experiencia de Usuario**
- Carga más rápida al sincronizar ambos componentes
- Estados de carga centralizados
- Manejo de errores unificado

### ✅ **Menos Carga en el Servidor**
- Reduce las peticiones HTTP a la mitad
- Menos overhead de red
- Mejor eficiencia del backend

### ✅ **Código Más Mantenible**
- Lógica de carga centralizada en AppComponent
- Componentes reciben datos ya procesados
- Fallback automático si no hay contenido precargado

## Backend Requerido

El backend debe soportar el siguiente endpoint:

```bash
POST /api/webpage/key
Content-Type: application/json

{
  "key": ["head", "home"],
  "language": "es"
}
```

## Cómo Probar

1. **Iniciar el backend NestJS en localhost:3000**
2. **Ejecutar Angular en desarrollo:**
   ```bash
   ng serve
   ```
3. **Verificar en Network DevTools:** Solo debería aparecer una petición a `/api/webpage/key` con `["head", "home"]`

## Compatibilidad

- ✅ Mantiene compatibilidad con la API existente
- ✅ Los componentes funcionan tanto con contenido precargado como cargando por separado
- ✅ Fallback automático en caso de errores
