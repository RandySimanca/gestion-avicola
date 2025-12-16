export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'GERENTE' | 'GALPONERO' | 'CONTADOR';
  name: string;
}

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
  tipo_ave: 'ENGORDE' | 'PONEDORA';
}

export interface Lote {
  id: string;
  galpon_id: string;
  tipo_ave: 'ENGORDE' | 'PONEDORA';
  fecha_ingreso: Date;
  poblacion_inicial: number;
  poblacion_actual: number;
  activo: boolean;
}
