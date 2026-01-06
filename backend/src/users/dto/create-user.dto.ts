import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '../enums/user.enums';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: UserRole;

  @IsEnum(UserStatus, { message: 'Estado inválido' })
  @IsOptional()
  estado?: UserStatus;
}

