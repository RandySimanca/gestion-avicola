import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateFincaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la finca es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El propietario es requerido' })
  propietario: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  municipio?: string;
}