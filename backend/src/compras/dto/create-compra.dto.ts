import { IsString, IsNumber, IsOptional, IsEnum, Min, IsDateString, IsNotEmpty, ValidateIf } from 'class-validator';

export enum TipoCompra {
  LOTE = 'LOTE',
  INSUMO = 'INSUMO',
}

export class CreateCompraDto {
  @IsEnum(TipoCompra)
  @IsNotEmpty({ message: 'El tipo de compra es requerido' })
  tipo_compra: TipoCompra;

  @IsDateString()
  @IsNotEmpty({ message: 'La fecha es requerida' })
  fecha: string;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  metodo_pago?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  // Campos específicos para compra de LOTE
  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del lote es requerido para compra de lote' })
  nombre_lote?: string;

  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsEnum(['DESCARTE', 'ENGORDE', 'PONEDORA'])
  @IsNotEmpty({ message: 'El tipo de ave es requerido para compra de lote' })
  tipo_ave?: 'DESCARTE' | 'ENGORDE' | 'PONEDORA';

  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsNumber()
  @Min(1, { message: 'La población inicial debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La población inicial es requerida para compra de lote' })
  poblacion_inicial?: number;

  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'El precio de compra unitario es requerido para compra de lote' })
  precio_compra_unitario?: number;

  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsString()
  @IsNotEmpty({ message: 'La finca es requerida para compra de lote' })
  finca_id?: string;

  @ValidateIf(o => o.tipo_compra === TipoCompra.LOTE)
  @IsString()
  @IsNotEmpty({ message: 'El galpón es requerido para compra de lote' })
  galpon_id?: string;

  // Campos específicos para compra de INSUMO
  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO)
  @IsString()
  @IsOptional()
  insumo_id?: string; // Para insumo existente

  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO && !o.insumo_id)
  @IsString()
  @IsNotEmpty({ message: 'El nombre del insumo es requerido para crear nuevo insumo' })
  nombre_insumo?: string; // Para crear nuevo insumo

  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO && !o.insumo_id)
  @IsEnum(['ALIMENTO', 'MEDICAMENTO', 'VACUNA', 'VITAMINA', 'DESINFECTANTE', 'OTRO'])
  @IsNotEmpty({ message: 'El tipo de insumo es requerido para crear nuevo insumo' })
  tipo_insumo?: 'ALIMENTO' | 'MEDICAMENTO' | 'VACUNA' | 'VITAMINA' | 'DESINFECTANTE' | 'OTRO';

  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO && !o.insumo_id)
  @IsString()
  @IsNotEmpty({ message: 'La unidad de medida es requerida para crear nuevo insumo' })
  unidad_medida?: string;

  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO)
  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  @IsNotEmpty({ message: 'La cantidad es requerida para compra de insumo' })
  cantidad?: number;

  @ValidateIf(o => o.tipo_compra === TipoCompra.INSUMO)
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'El precio unitario es requerido para compra de insumo' })
  precio_unitario?: number;

  // Campo calculado
  @IsNumber()
  @Min(0)
  @IsNotEmpty({ message: 'El total es requerido' })
  total: number;
}
