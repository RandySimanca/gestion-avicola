import { IsString, IsNumber, IsOptional, IsEnum, Min, IsDateString } from 'class-validator';

export enum CategoriaGasto {
  INVERSION = 'INVERSION',
  GASTO = 'GASTO',
}

export class CreateGastoDto {
  @IsString()
  @IsOptional()
  lote_id?: string;

  @IsDateString()
  fecha: string;

  @IsString()
  concepto: string;

  @IsEnum(CategoriaGasto)
  categoria: CategoriaGasto;

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
  observaciones?: string;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  metodo_pago?: string;

  @IsString()
  @IsOptional()
  insumo_id?: string;

  @IsString()
  @IsOptional()
  tipo_gasto?: 'COMPRA_INSUMO' | 'GASTO_OPERATIVO' | 'CONSUMO_LOTE';
}
