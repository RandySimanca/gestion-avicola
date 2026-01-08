import { IsString, IsNumber, IsOptional, IsEnum, Min, IsDateString, IsNotEmpty } from 'class-validator';

export enum TipoGastoOperativo {
  NOMINA = 'NOMINA',
  SERVICIOS_PUBLICOS = 'SERVICIOS_PUBLICOS',
  ARRIENDO = 'ARRIENDO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  ASEO = 'ASEO',
  OTRO = 'OTRO',
}

export class CreateGastoDto {
  @IsDateString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'El concepto es requerido' })
  concepto: string;

  @IsEnum(TipoGastoOperativo)
  @IsNotEmpty({ message: 'El tipo de gasto operativo es requerido' })
  tipo_gasto: TipoGastoOperativo;

  @IsString()
  @IsOptional()
  lote_id?: string; // Opcional: asociar gasto a un lote específico

  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  cantidad: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'El precio unitario es requerido' })
  precio_unitario: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'El total es requerido' })
  total: number;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  metodo_pago?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
