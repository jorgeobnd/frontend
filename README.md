# 📦 Sistema de Inventario Multisucursal (SIM) - Frontend

Este proyecto es la solución Frontend para el desafío técnico de **Digital Tech**, desarrollado con **Angular 16+** y **Tailwind CSS**. 

El objetivo principal de esta interfaz es reducir la fricción operativa, permitiendo a los administradores gestionar sucursales, productos e inventarios con el mínimo número de clics posible.

## 🚀 Características Principales

### 1. Gestión Unificada (Single Screen Experience)
A diferencia de los sistemas tradicionales que obligan a navegar entre múltiples páginas ("Ir a Sucursales" -> "Ir a Productos"), esta solución centraliza todo en un **Dashboard Interactivo**.
- **Selección de Sucursal:** Visualización rápida de sedes mediante tarjetas interactivas.
- **Gestión de Contexto:** Al seleccionar una sede, la interfaz se transforma para mostrar el inventario específico de esa ubicación.

### 2. Edición de Stock "Sin Fricción"
Siguiendo el requerimiento de *mínima fricción*:
- **Edición en Línea:** Los campos de stock son editables directamente en la tabla. No hace falta hacer clic en "Editar", cambiar el valor y dar clic en "Guardar". 
- **Guardado Automático:** El sistema detecta cuando el usuario termina de escribir (evento `blur` o `Enter`) y envía la actualización al backend automáticamente.

### 3. Catálogo Maestro Integrado
- **Creación en Contexto:** Se pueden crear nuevos productos directamente desde la vista de inventario. El sistema lo añade al Catálogo Global y lo asigna inmediatamente a la sucursal actual con stock 0.
- **Gestión Completa:** Edición de precio/SKU y eliminación de productos obsoletos sin salir del flujo de trabajo principal.

---

## 🛠️ Decisiones Técnicas y Arquitectura

### Stack Tecnológico
- **Framework:** Angular 16+ (Standalone Components & Modules).
- **Estilos:** Tailwind CSS (Utility-first framework) para un diseño rápido, consistente y 100% responsivo.
- **HTTP Client:** `HttpClient` de Angular para comunicación REST.

### Patrones de Diseño Implementados

#### A. Smart Component Pattern (`InventoryComponent`)
Se ha centralizado la lógica de negocio en un componente "inteligente" que orquesta:
1.  La carga de datos maestros (Sucursales).
2.  La gestión del estado seleccionado (`selectedBranchId`).
3.  La sincronización reactiva del inventario.

#### B. Optimistic UI (Interfaz Optimista)
Para mejorar la percepción de velocidad:
- Al crear un producto o sucursal, la interfaz se actualiza **inmediatamente** en el cliente mientras la petición viaja al servidor.
- Esto elimina la espera visual y hace que la aplicación se sienta "nativa".

#### C. Servicio Centralizado (`ApiService`)
Toda la comunicación con el Backend (Spring Boot) está encapsulada en `api.service.ts`, manteniendo el principio de **Separación de Responsabilidades**. El componente no sabe de URLs ni de HTTP, solo de Observables de datos.

---

## 🎨 UX/UI y Tailwind CSS

Se priorizó la claridad visual y el feedback inmediato:
- **Animaciones CSS:** Transiciones suaves (`fade-in`, `slide-down`) para evitar cambios bruscos en el DOM que confundan al usuario.
- **Estados de Carga:** Indicadores visuales durante operaciones asíncronas.
- **Diseño Mobile-First:** La grilla de sucursales y las tablas se adaptan fluidamente a pantallas pequeñas.

---

## ⚙️ Instalación y Ejecución

Asegúrate de tener instalado **Node.js** y **Angular CLI**.

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar servidor de desarrollo:**
   ```bash
   ng serve
   ```
   La aplicación estará disponible en `http://localhost:4200/`.

3. **Configuración de Backend:**
   Asegúrate de que el backend Spring Boot esté corriendo en el puerto `8080`.

---

## 📂 Estructura del Proyecto

```
src/app/
├── components/
│   └── inventory/       # Componente principal (Lógica y Vista)
├── models/              # Interfaces TypeScript (Tipado fuerte)
│   ├── branch.model.ts
│   └── inventory.model.ts
└── services/            # Comunicación HTTP
    └── api.service.ts
```
