import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateVentaDto {
  @IsString()
  @IsNotEmpty({ message: 'El lote es requerido' })
  lote_id: string;

  @IsNumber()
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  cantidad: number;

  @IsNumber()
  @IsNotEmpty({ message: 'El precio unitario es requerido' })
  precio_unitario: number;

  @IsNumber()
  @IsNotEmpty({ message: 'El total es requerido' })
  total: number;

  @IsString()
  @IsNotEmpty({ message: 'El cliente es requerido' })
  cliente: string;

  @IsString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @IsString()
  @IsNotEmpty({ message: 'La forma de pago es requerida' })
  forma_pago: string; // CONTADO_EFECTIVO, CONTADO_TRANSFERENCIA, CREDITO

  @IsString()
  @IsOptional()
  observaciones?: string;
}
