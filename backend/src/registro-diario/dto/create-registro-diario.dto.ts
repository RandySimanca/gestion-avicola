import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateRegistroDiarioDto {
  @IsNotEmpty()
  @IsString()
  lote_id: string;

  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @IsNotEmpty()
  @IsNumber()
  mortalidad_dia: number;

  @IsNotEmpty()
  @IsNumber()
  alimento_consumido_kg: number;

  @IsOptional()
  @IsNumber()
  peso_promedio_g?: number;

  @IsOptional()
  @IsNumber()
  huevos_totales?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
