import { IsString, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';

export enum TipoInsumo {
  ALIMENTO = 'ALIMENTO',
  MEDICAMENTO = 'MEDICAMENTO',
  VACUNA = 'VACUNA',
  VITAMINA = 'VITAMINA',
  DESINFECTANTE = 'DESINFECTANTE',
  OTRO = 'OTRO',
}

export class CreateInsumoDto {
  @IsString()
  nombre_producto: string;

  @IsEnum(TipoInsumo)
  tipo: TipoInsumo;

  @IsString()
  @IsOptional()
  codigo_producto?: string;

  @IsString()
  @IsOptional()
  unidad_medida?: string; // kg, litros, unidades, etc.

  @IsNumber()
  @Min(0)
  stock_actual: number;

  @IsNumber()
  @Min(0)
  stock_minimo: number;

  @IsNumber()
  @Min(0)
  precio_unitario: number;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}