import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateProgramaSanitarioDto {
  @IsNotEmpty()
  @IsString()
  lote_id: string;

  @IsNotEmpty()
  @IsString()
  etapa_aplicacion: string;

  @IsNotEmpty()
  @IsString()
  vacuna_medicamento: string;

  @IsNotEmpty()
  @IsNumber()
  dosis_recomendada: number;

  @IsNotEmpty()
  @IsNumber()
  edad_aplicacion_dias: number;

  @IsNotEmpty()
  @IsString()
  via_administracion: string;
}
