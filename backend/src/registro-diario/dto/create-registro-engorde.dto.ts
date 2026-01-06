import { IsString, IsNumber, IsDateString, Min, IsOptional } from 'class-validator';

export class CreateRegistroEngordeDto {
  @IsString()
  lote_id: string;

  @IsDateString()
  fecha: string; // ISO Date string

  @IsNumber()
  @Min(0)
  mortalidad_dia: number;

  @IsNumber()
  @Min(0)
  alimento_consumido_kg: number;

  @IsNumber()
  @Min(0)
  peso_promedio_kg: number;

  @IsNumber()
  @Min(0)
  poblacion_actual: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  usuario_registro?: string; // UID del usuario que registra
}