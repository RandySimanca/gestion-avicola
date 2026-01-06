import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateAplicacionSanitariaDto {
  @IsNotEmpty()
  @IsString()
  programa_sanitario_id: string;

  @IsNotEmpty()
  @IsString()
  lote_id: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_aplicacion: string;

  @IsNotEmpty()
  @IsNumber()
  cantidad_aplicada: number;

  @IsNotEmpty()
  @IsNumber()
  costo_aplicacion: number;

  @IsNotEmpty()
  @IsString()
  aplicado_por: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
