# Plan de Implementación: Módulo de Compras

## 📋 Objetivo
Separar el módulo de "Gastos e Inversiones" en dos módulos independientes:

1. **Módulo de Compras**: Para comprar lotes e insumos (inversiones que generan activos)
2. **Módulo de Gastos Operativos**: Para pagar nómina, servicios públicos, arriendo y otros gastos operativos

### Funcionalidades del Módulo de Compras

#### 1. **Compra de Lotes**
- Crear lote desde el módulo de compras
- Asignar nombre al lote
- Seleccionar finca y galpón
- Definir tipo de ave (DESCARTE/ENGORDE/PONEDORA)
- Establecer población inicial y precio unitario
- El lote debe aparecer automáticamente en la gestión de lotes
- Registrar la compra como inversión

#### 2. **Compra de Insumos**
- Comprar insumos existentes (actualizar stock)
- Comprar nuevos insumos (crear en inventario)
- Tipos de insumos: ALIMENTO, MEDICAMENTO, VACUNA, DESINFECTANTE, OTRO
- Actualizar precio unitario con el de la última compra
- Incrementar stock automáticamente
- Registrar la compra como inversión

### Funcionalidades del Módulo de Gastos Operativos

#### 1. **Gastos Operativos**
- Pagar nómina de empleados
- Pagar servicios públicos (luz, agua, gas, internet)
- Pagar arriendos
- Pagar otros gastos operativos (aseo, mantenimiento, etc.)
- Registrar método de pago (efectivo, transferencia, crédito)
- Asociar gasto a un lote específico (opcional)
- Categorizar gastos por tipo

---

## 🏗️ Decisión Arquitectónica: Separación de Módulos

### ¿Por qué separar Compras de Gastos Operativos?

**Razones principales**:

1. **Diferencia Conceptual**:
   - **Compras**: Son inversiones que generan activos (lotes, inventario)
   - **Gastos Operativos**: Son costos que no generan activos (nómina, servicios)

2. **Impacto en el Negocio**:
   - Las compras afectan el inventario y los lotes
   - Los gastos operativos solo afectan el flujo de caja

3. **Reportes y Análisis**:
   - Las compras se analizan como inversiones
   - Los gastos operativos se analizan como costos de operación

4. **Usuarios Diferentes**:
   - Compras: Gerente de compras, encargado de bodega
   - Gastos Operativos: Contador, administrador

5. **Flujos de Trabajo Diferentes**:
   - Compras requieren selección de proveedores, gestión de inventario
   - Gastos operativos requieren categorización, asociación a períodos

### Estructura Propuesta

```
Backend:
├── compras/
│   ├── compras.module.ts
│   ├── compras.service.ts
│   ├── compras.controller.ts
│   └── dto/
│       ├── create-compra.dto.ts
│       └── update-compra.dto.ts
└── gastos/ (o gastos-operativos/)
    ├── gastos.module.ts
    ├── gastos.service.ts
    ├── gastos.controller.ts
    └── dto/
        ├── create-gasto.dto.ts
        └── update-gasto.dto.ts

Frontend Mobile:
├── screens/
│   ├── ComprasScreen.tsx (NUEVO)
│   └── GastosScreen.tsx (REFACTORIZADO)
└── navigation/
    └── AppNavigator.tsx (ACTUALIZADO)
```

---

## 📐 Arquitectura y Cambios Técnicos

### Backend (NestJS)

#### Opción Recomendada: Dos Módulos Separados

**Estructura propuesta**:
- `backend/src/compras/` - Nuevo módulo para compras
- `backend/src/gastos-operativos/` - Nuevo módulo para gastos operativos (o mantener `gastos/` pero solo para operativos)

#### 1. **Crear Módulo de Compras**
**Archivo**: `backend/src/compras/dto/create-compra.dto.ts`

```typescript
export enum TipoCompra {
  LOTE = 'LOTE',
  INSUMO = 'INSUMO'
}

export class CreateCompraDto {
  @IsEnum(TipoCompra)
  tipo_compra: TipoCompra;
  
  @IsDateString()
  fecha: string;
  
  @IsString()
  proveedor?: string;
  
  @IsString()
  metodo_pago?: string;
  
  // Campos comunes
  @IsNumber()
  @Min(0)
  total: number;
  
  // Campos específicos para compra de lote
  @IsString()
  @IsOptional()
  nombre_lote?: string;
  
  @IsString()
  @IsOptional()
  tipo_ave?: 'DESCARTE' | 'ENGORDE' | 'PONEDORA';
  
  @IsNumber()
  @IsOptional()
  poblacion_inicial?: number;
  
  @IsNumber()
  @IsOptional()
  precio_compra_unitario?: number;
  
  @IsString()
  @IsOptional()
  finca_id?: string;
  
  @IsString()
  @IsOptional()
  galpon_id?: string;
  
  // Campos específicos para compra de insumo
  @IsString()
  @IsOptional()
  insumo_id?: string; // Para insumo existente
  
  @IsString()
  @IsOptional()
  nombre_insumo?: string; // Para crear nuevo insumo
  
  @IsString()
  @IsOptional()
  tipo_insumo?: 'ALIMENTO' | 'MEDICAMENTO' | 'VACUNA' | 'DESINFECTANTE' | 'OTRO';
  
  @IsString()
  @IsOptional()
  unidad_medida?: string;
  
  @IsNumber()
  @IsOptional()
  cantidad?: number;
  
  @IsNumber()
  @IsOptional()
  precio_unitario?: number;
}
```

#### 2. **Crear ComprasService**
**Archivo**: `backend/src/compras/compras.service.ts`

**Lógica a implementar**:
- **Si tipo_compra === 'LOTE'**:
  1. Crear registro en colección `LOTE` con todos los datos
  2. Crear registro en `GASTOS` con `tipo_gasto: 'COMPRA_LOTE'` y `categoria: 'INVERSION'`
  3. Retornar ambos IDs (lote_id y gasto_id)

- **Si tipo_compra === 'INSUMO'**:
  1. Si `insumo_id` existe: actualizar stock y precio
  2. Si `insumo_id` no existe pero hay `nombre_insumo`: crear nuevo insumo
  3. Crear registro en `GASTOS` con `tipo_gasto: 'COMPRA_INSUMO'` y `categoria: 'INVERSION'`
  4. Actualizar/crear en colección `INSUMO`

#### 3. **Actualizar Módulo de Gastos (Solo Operativos)**
**Archivo**: `backend/src/gastos/dto/create-gasto.dto.ts`

**Simplificar DTO para solo gastos operativos**:
```typescript
export enum TipoGastoOperativo {
  NOMINA = 'NOMINA',
  SERVICIOS_PUBLICOS = 'SERVICIOS_PUBLICOS',
  ARRIENDO = 'ARRIENDO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  ASEO = 'ASEO',
  OTRO = 'OTRO'
}

export class CreateGastoDto {
  @IsDateString()
  fecha: string;
  
  @IsString()
  concepto: string;
  
  @IsEnum(TipoGastoOperativo)
  tipo_gasto: TipoGastoOperativo;
  
  @IsString()
  @IsOptional()
  lote_id?: string; // Opcional: asociar a un lote
  
  @IsNumber()
  @Min(0)
  cantidad: number;
  
  @IsNumber()
  @Min(0)
  precio_unitario: number;
  
  @IsNumber()
  @Min(0)
  total: number;
  
  @IsString()
  @IsOptional()
  proveedor?: string;
  
  @IsString()
  @IsOptional()
  metodo_pago?: string;
  
  @IsString()
  @IsOptional()
  observaciones?: string;
}
```

**Actualizar GastosService**:
- Eliminar lógica de compras de insumos
- Mantener solo lógica de gastos operativos
- Crear registro en `GASTOS` con `tipo_gasto: 'GASTO_OPERATIVO'` y `categoria: 'GASTO'`

### Frontend Mobile (React Native)

#### 1. **Crear ComprasScreen (Nuevo)**
**Archivo**: `mobile/src/screens/ComprasScreen.tsx`

**Funcionalidades**:
- Selector de tipo de compra: LOTE / INSUMO
- Formulario condicional según tipo:
  - **LOTE**: Nombre, Finca, Galpón, Tipo Ave, Población, Precio Unitario, Proveedor, Método de Pago
  - **INSUMO**: Selector de insumo existente O crear nuevo (nombre, tipo, unidad), Cantidad, Precio Unitario, Proveedor, Método de Pago
- Integrar componentes `FincaSelector` y `GalponSelector` para compra de lotes
- Mostrar mensaje de éxito con ID del lote creado
- Listar historial de compras (lotes e insumos)

#### 2. **Actualizar GastosScreen (Solo Operativos)**
**Archivo**: `mobile/src/screens/GastosScreen.tsx`

**Cambios necesarios**:
- Eliminar opción de compra de insumos
- Mantener solo gastos operativos
- Agregar selector de tipo de gasto: NÓMINA / SERVICIOS PÚBLICOS / ARRIENDO / MANTENIMIENTO / ASEO / OTRO
- Campo opcional para asociar gasto a un lote
- Mantener campos: concepto, cantidad, precio unitario, total, proveedor, método de pago

#### 3. **Actualizar Navegación**
**Archivo**: `mobile/src/navigation/AppNavigator.tsx`

**Cambios necesarios**:
- Agregar nueva pantalla "Compras" al drawer
- Mantener pantalla "Gastos Operativos" (renombrar de "Gastos e Inversión")
- Actualizar iconos y títulos

#### 4. **Actualizar API Service**
**Archivo**: `mobile/src/services/api-service.ts`

**Métodos a agregar**:
```typescript
// Nuevos métodos para compras
async createCompra(compra: any): Promise<ApiResponse<any>> {
  // Llamar al endpoint de compras
}

async getCompras(): Promise<ApiResponse<any[]>> {
  // Obtener historial de compras
}

// Mantener métodos de gastos operativos
async createGastoOperativo(gasto: any): Promise<ApiResponse<any>> {
  // Llamar al endpoint de gastos operativos
}
```

### Frontend Web (Vue.js) - Opcional

Si existe vista de gastos en web, aplicar los mismos cambios:
- Agregar selector de tipo de compra
- Formularios condicionales
- Integración con selectores de finca/galpón

---

## 📝 Tareas de Implementación

### Fase 1: Backend - Crear Módulo de Compras
- [ ] **Tarea 1.1**: Crear módulo `compras` en backend (`backend/src/compras/`)
- [ ] **Tarea 1.2**: Crear DTO `CreateCompraDto` con campos para lotes e insumos
- [ ] **Tarea 1.3**: Crear `ComprasService` con lógica para compra de lotes
- [ ] **Tarea 1.4**: Implementar lógica en `ComprasService` para compra de insumos nuevos
- [ ] **Tarea 1.5**: Implementar lógica en `ComprasService` para compra de insumos existentes
- [ ] **Tarea 1.6**: Crear `ComprasController` con endpoints POST y GET
- [ ] **Tarea 1.7**: Registrar `ComprasModule` en `AppModule`
- [ ] **Tarea 1.8**: Agregar validaciones según tipo_compra

### Fase 2: Backend - Refactorizar Módulo de Gastos
- [ ] **Tarea 2.1**: Simplificar `CreateGastoDto` para solo gastos operativos
- [ ] **Tarea 2.2**: Agregar enum `TipoGastoOperativo` al DTO
- [ ] **Tarea 2.3**: Eliminar lógica de compras de `GastosService`
- [ ] **Tarea 2.4**: Actualizar `GastosService` para solo manejar gastos operativos
- [ ] **Tarea 2.5**: Actualizar `GastosController` con validaciones simplificadas
- [ ] **Tarea 2.6**: Renombrar módulo a `GastosOperativosModule` (opcional, o mantener nombre)

### Fase 3: Frontend Mobile - Crear Pantalla de Compras
- [ ] **Tarea 3.1**: Crear `ComprasScreen.tsx` nuevo
- [ ] **Tarea 3.2**: Agregar selector de tipo de compra (LOTE/INSUMO)
- [ ] **Tarea 3.3**: Crear formulario condicional para compra de lotes
- [ ] **Tarea 3.4**: Integrar `FincaSelector` y `GalponSelector` en formulario de lotes
- [ ] **Tarea 3.5**: Crear formulario para compra de insumos (existente o nuevo)
- [ ] **Tarea 3.6**: Agregar validaciones según tipo de compra
- [ ] **Tarea 3.7**: Implementar listado de historial de compras
- [ ] **Tarea 3.8**: Agregar pantalla al drawer navigation

### Fase 4: Frontend Mobile - Actualizar Pantalla de Gastos
- [ ] **Tarea 4.1**: Eliminar opción de compra de insumos de `GastosScreen`
- [ ] **Tarea 4.2**: Agregar selector de tipo de gasto operativo
- [ ] **Tarea 4.3**: Mantener campo opcional para asociar gasto a lote
- [ ] **Tarea 4.4**: Actualizar título de pantalla a "Gastos Operativos"
- [ ] **Tarea 4.5**: Actualizar icono y nombre en drawer navigation

### Fase 5: API Service Mobile
- [ ] **Tarea 5.1**: Crear método `createCompra()` en `api-service.ts`
- [ ] **Tarea 5.2**: Crear método `getCompras()` para historial
- [ ] **Tarea 5.3**: Actualizar método `createGasto()` para solo gastos operativos
- [ ] **Tarea 5.4**: Actualizar método `getGastos()` si es necesario

### Fase 6: Frontend Web (Opcional)
- [ ] **Tarea 6.1**: Revisar si existe vista de gastos en web
- [ ] **Tarea 6.2**: Crear vista de Compras si aplica
- [ ] **Tarea 6.3**: Actualizar vista de Gastos para solo operativos
- [ ] **Tarea 6.4**: Actualizar navegación/rutas en web

### Fase 7: Validaciones y Pruebas
- [ ] **Tarea 7.1**: Probar creación de lote desde compras y verificar que aparece en gestión de lotes
- [ ] **Tarea 7.2**: Probar compra de insumo existente y verificar actualización de stock
- [ ] **Tarea 7.3**: Probar compra de nuevo insumo y verificar creación en inventario
- [ ] **Tarea 7.4**: Validar que gastos operativos funcionan correctamente
- [ ] **Tarea 7.5**: Probar validaciones de campos requeridos según tipo
- [ ] **Tarea 7.6**: Verificar que los precios unitarios se actualizan correctamente
- [ ] **Tarea 7.7**: Probar flujo completo offline (si aplica)
- [ ] **Tarea 7.8**: Verificar que reportes y resúmenes funcionan con la nueva estructura

---

## 🔄 Flujos de Trabajo

### Flujo 1: Compra de Lote
```
Usuario selecciona "Comprar Lote"
  ↓
Completa formulario: nombre, finca, galpón, tipo ave, población, precio
  ↓
Backend recibe petición con tipo_compra: 'LOTE'
  ↓
GastosService crea registro en LOTE
  ↓
GastosService crea registro en GASTOS (tipo_gasto: 'COMPRA_LOTE')
  ↓
Retorna respuesta con lote_id y gasto_id
  ↓
Lote aparece automáticamente en gestión de lotes
```

### Flujo 2: Compra de Insumo Existente
```
Usuario selecciona "Comprar Insumo"
  ↓
Selecciona insumo existente del listado
  ↓
Ingresa cantidad y precio unitario
  ↓
Backend recibe petición con tipo_compra: 'INSUMO' e insumo_id
  ↓
GastosService actualiza stock_actual del insumo
  ↓
GastosService actualiza precio_unitario del insumo
  ↓
GastosService crea registro en GASTOS (tipo_gasto: 'COMPRA_INSUMO')
  ↓
Inventario refleja el nuevo stock
```

### Flujo 3: Compra de Nuevo Insumo
```
Usuario selecciona "Comprar Insumo"
  ↓
Selecciona "Crear nuevo insumo"
  ↓
Completa: nombre, tipo, unidad de medida, cantidad, precio
  ↓
Backend recibe petición con tipo_compra: 'INSUMO' y datos del nuevo insumo
  ↓
GastosService crea registro en INSUMO con stock inicial
  ↓
GastosService crea registro en GASTOS (tipo_gasto: 'COMPRA_INSUMO')
  ↓
Nuevo insumo aparece en inventario
```

---

## 📊 Estructura de Datos

### Registro en GASTOS (Compra de Lote)
```json
{
  "tipo_compra": "LOTE",
  "tipo_gasto": "COMPRA_LOTE",
  "categoria": "INVERSION",
  "fecha": "2024-01-15T10:00:00Z",
  "concepto": "Compra de lote: Lote-001",
  "cantidad": 1000,
  "precio_unitario": 5000,
  "total": 5000000,
  "proveedor": "Proveedor de Aves",
  "metodo_pago": "EFECTIVO",
  "lote_id": "abc123", // ID del lote creado
  "fecha_creacion": "2024-01-15T10:00:00Z"
}
```

### Registro en GASTOS (Compra de Insumo)
```json
{
  "tipo_compra": "INSUMO",
  "tipo_gasto": "COMPRA_INSUMO",
  "categoria": "INVERSION",
  "fecha": "2024-01-15T10:00:00Z",
  "concepto": "Compra: Alimento Balanceado",
  "cantidad": 50,
  "precio_unitario": 45000,
  "total": 2250000,
  "proveedor": "Proveedor de Alimentos",
  "metodo_pago": "TRANSFERENCIA",
  "insumo_id": "xyz789",
  "fecha_creacion": "2024-01-15T10:00:00Z"
}
```

---

## ✅ Criterios de Aceptación

1. ✅ Un usuario puede comprar un lote desde el módulo de compras
2. ✅ El lote creado aparece automáticamente en la gestión de lotes
3. ✅ Un usuario puede comprar insumos existentes y el stock se actualiza
4. ✅ Un usuario puede comprar nuevos insumos y se crean en inventario
5. ✅ Los gastos operativos siguen funcionando como antes
6. ✅ Todas las compras se registran en el historial de gastos
7. ✅ Los precios unitarios se actualizan con la última compra
8. ✅ Las validaciones funcionan correctamente según el tipo de compra

---

## 🚀 Priorización

### Alta Prioridad
- Compra de lotes desde módulo de compras
- Compra de insumos existentes con actualización de stock
- Mantener funcionalidad de gastos operativos

### Media Prioridad
- Compra de nuevos insumos desde módulo de compras
- Mejoras en interfaz de usuario
- Validaciones avanzadas

### Baja Prioridad
- Actualización de interfaz web (si existe)
- Reportes específicos de compras
- Historial de compras por proveedor

---

## 📝 Notas Técnicas

- El módulo de Gastos ya tiene lógica parcial para `COMPRA_INSUMO`, solo necesita extenderse
- Los lotes se crean actualmente desde `CreateLoteScreen`, esta funcionalidad se moverá al módulo de compras
- El inventario de insumos ya se actualiza parcialmente, solo necesita mejorarse
- Se debe mantener compatibilidad con registros existentes de gastos

---

## 🎯 Resultado Esperado

Al finalizar la implementación, se tendrán **dos módulos separados y claramente definidos**:

### Módulo de Compras
- ✅ Compra de lotes (con creación automática en gestión de lotes)
- ✅ Compra de insumos (con actualización automática de inventario)
- ✅ Historial de compras (lotes e insumos)
- ✅ Interfaz dedicada y especializada

### Módulo de Gastos Operativos
- ✅ Registro de nómina
- ✅ Pago de servicios públicos
- ✅ Pago de arriendos
- ✅ Otros gastos operativos
- ✅ Asociación opcional a lotes
- ✅ Categorización por tipo de gasto

### Beneficios de la Separación
- ✅ **Claridad conceptual**: Compras vs Gastos son conceptos diferentes
- ✅ **Mejor organización**: Cada módulo tiene su propósito específico
- ✅ **Facilidad de uso**: Interfaces más simples y enfocadas
- ✅ **Mejor reporteo**: Separación clara entre inversiones (compras) y gastos operativos
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades a cada módulo
