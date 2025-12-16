export class CreateLoteDto {
  galpon_id: string;
  tipo_ave: 'ENGORDE' | 'PONEDORA';
  fecha_ingreso: string; // ISO Date string
  poblacion_inicial: number;
  poblacion_actual: number;
  costo_total_acum: number;
  activo: boolean;
}
