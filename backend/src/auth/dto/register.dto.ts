import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../users/enums/user.enums';

export class RegisterDto {
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
}
