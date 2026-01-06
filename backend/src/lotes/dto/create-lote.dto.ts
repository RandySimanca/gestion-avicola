import { IsString, IsNotEmpty, IsNumber, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class CreateLoteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del lote es requerido' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'La finca es requerida' })
  finca_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El galpón es requerido' })
  galpon_id: string;

  @IsEnum(['ENGORDE', 'PONEDORA'], { message: 'El tipo de ave debe ser ENGORDE o PONEDORA' })
  @IsNotEmpty({ message: 'El tipo de ave es requerido' })
  tipo_ave: 'ENGORDE' | 'PONEDORA';

  @IsString()
  @IsNotEmpty({ message: 'La fecha de ingreso es requerida' })
  fecha_ingreso: string; // ISO Date string

  @IsNumber()
  @IsNotEmpty({ message: 'La población inicial es requerida' })
  poblacion_inicial: number;

  @IsNumber()
  @IsOptional()
  poblacion_actual?: number;

  @IsNumber()
  @IsOptional()
  costo_total_acum?: number;

  @IsNumber()
  @IsOptional()
  precio_compra_unitario?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  fecha_finalizacion?: string;
}
