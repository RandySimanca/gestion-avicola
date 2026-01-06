// Tipos extendidos basados en la especificación del proyecto

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'GERENTE' | 'GALPONERO' | 'CONTADOR';
  name: string;
}

// Módulos Maestros y de Inventario
export interface Finca {
  id: string;
  nombre: string;
  propietario: string;
}

export interface Galpon {
  id: string;
  finca_id: string;
  nombre: string;
  capacidad_max: number;
  tipo_ave_principal: 'ENGORDE' | 'PONEDORA';
}

export interface Lote {
  id: string;
  galpon_id: string;
  tipo_ave: 'ENGORDE' | 'PONEDORA';
  fecha_ingreso: Date;
  poblacion_inicial: number;
  poblacion_actual: number;
  activo: boolean;
  // Campos agregados (calculados)
  costo_total_acum?: number;
  peso_promedio_actual?: number;
  ica_acumulado?: number;
  mortalidad_acumulada?: number;
}

export interface CicloProduccion {
  id: string;
  lote_id: string;
  peso_meta_kg?: number; // Engorde
  meta_postura_pico?: number; // Ponedoras
  ica_meta: number;
  duracion_dias_esperada: number;
}

// Módulos Transaccionales
export interface MovimientoInventario {
  id: string;
  lote_id: string;
  tipo_movimiento: 'ENTRADA' | 'VENTA' | 'DESCARTE';
  cantidad: number;
  fecha: Date;
  motivo: string;
}

export interface RegistroDiarioProduccion {
  id: string;
  lote_id: string;
  fecha: Date;
  mortalidad_dia: number;
  alimento_consumido_kg: number;
  peso_promedio_g?: number; // Engorde
  huevos_totales?: number; // Ponedoras
  observaciones?: string;
}

export interface RegistroEngorde {
  id: string;
  registro_diario_id: string;
  peso_promedio_g: number;
  ica_acumulado: number;
  conversion_alimenticia_actual: number;
  ganancia_peso_diaria_g: number;
}

export interface RegistroPostura {
  id: string;
  registro_diario_id: string;
  huevos_totales: number;
  clasificacion_detalle: {
    grandes: number;
    medianos: number;
    pequeños: number;
    rotos: number;
  };
  porcentaje_postura: number;
  peso_promedio_huevo_g: number;
}

// Módulos de Costos y Sanidad
export interface Insumo {
  id: string;
  nombre_producto: string;
  tipo_insumo: 'ALIMENTO' | 'MEDICAMENTO' | 'VACUNA' | 'DEINFECTANTE' | 'OTRO';
  stock_actual: number;
  unidad_medida: string;
  precio_promedio: number;
  proveedor: string;
}

export interface ConsumoInsumo {
  id: string;
  lote_id: string;
  insumo_id: string;
  cantidad_consumida: number;
  costo_total_lote: number;
  fecha_consumo: Date;
  aplicado_por: string; // ID de usuario
}

export interface ProgramaSanitario {
  id: string;
  lote_id: string;
  etapa_aplicacion: string; // "Inicio", "Crianza", "Engorde", etc.
  vacuna_medicamento: string;
  dosis_recomendada: number;
  edad_aplicacion_dias: number;
  via_administracion: string;
}

export interface AplicacionSanitaria {
  id: string;
  programa_sanitario_id: string;
  lote_id: string;
  fecha_aplicacion: Date;
  cantidad_aplicada: number;
  costo_aplicacion: number;
  aplicado_por: string; // ID de usuario
  observaciones?: string;
}

// KPIs y Métricas
export interface KPIsLote {
  lote_id: string;
  tasa_mortalidad_porcentual: number;
  ica_acumulado: number;
  costo_por_kg_pollos?: number;
  costo_por_docena_huevos?: number;
  postura_semanal_porcentual?: number;
  conversion_alimenticia_actual: number;
  dias_en_produccion: number;
  rentabilidad_actual: number;
}

// Sincronización Móvil
export interface PendingSync {
  id: string;
  tabla: string;
  datos: any;
  fecha_creacion: Date;
  sincronizado: boolean;
}

// Reportes
export interface ReporteProduccion {
  lote_id: string;
  periodo: {
    fecha_inicio: Date;
    fecha_fin: Date;
  };
  resumen: {
    mortalidad_total: number;
    alimento_consumido_total: number;
    peso_promedio_final: number;
    produccion_total: number; // Huevos o peso
  };
  kpis: KPIsLote;
}
