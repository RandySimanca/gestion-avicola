import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateConsumoInsumoDto {
  @IsString()
  @IsNotEmpty()
  lote_id: string;

  @IsString()
  @IsNotEmpty()
  insumo_id: string;

  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsString()
  @IsOptional()
  unidad_medida?: string;

  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
