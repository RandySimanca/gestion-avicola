import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export class CreateGalponDto {
  @IsString()
  @IsNotEmpty({ message: 'La finca es requerida' })
  finca_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del galpón es requerido' })
  nombre: string;

  @IsNumber()
  @IsNotEmpty({ message: 'La capacidad es requerida' })
  capacidad_max: number;

  @IsEnum(['ENGORDE', 'PONEDORA'], { message: 'El tipo de ave debe ser ENGORDE o PONEDORA' })
  @IsNotEmpty({ message: 'El tipo de ave es requerido' })
  tipo_ave_principal: 'ENGORDE' | 'PONEDORA';
}
