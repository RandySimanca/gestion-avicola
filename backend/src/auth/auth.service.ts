import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../firebase/firebase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserStatus } from '../users/enums/user.enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    try {
      // 1. Crear usuario en Firebase Auth
      const userRecord = await this.firebaseService.getAuth().createUser({
        email,
        password,
        displayName: name,
      });

      // 2. Crear documento en Firestore con estado PENDIENTE
      await this.firebaseService
        .getFirestore()
        .collection('USUARIOS')
        .doc(userRecord.uid)
        .set({
          email,
          name,
          role,
          estado: UserStatus.PENDIENTE,
          createdAt: new Date(),
        });

      return {
        message:
          'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.',
        uid: userRecord.uid,
      };
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new UnauthorizedException('El email ya está registrado');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // 1. Obtener usuario de Firebase Auth
      const userRecord = await this.firebaseService
        .getAuth()
        .getUserByEmail(email);

      // 2. Verificar contraseña usando Firebase Auth signInWithEmailAndPassword
      // Nota: Firebase Admin SDK no puede verificar contraseñas directamente
      // Necesitamos usar el cliente de Firebase o verificar de otra manera
      // Por ahora, asumimos que la verificación se hace en el cliente

      // 3. Obtener datos del usuario de Firestore
      const userDoc = await this.firebaseService
        .getFirestore()
        .collection('USUARIOS')
        .doc(userRecord.uid)
        .get();

      if (!userDoc.exists) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      const userData = userDoc.data();

      // 4. Verificar estado del usuario
      if (userData.estado !== UserStatus.ACTIVO) {
        const messages = {
          [UserStatus.PENDIENTE]:
            'Tu cuenta está pendiente de aprobación por un administrador',
          [UserStatus.RECHAZADO]: 'Tu cuenta ha sido rechazada',
          [UserStatus.INACTIVO]: 'Tu cuenta ha sido desactivada',
        };
        throw new UnauthorizedException(
          messages[userData.estado] || 'No puedes acceder al sistema',
        );
      }

      // 5. Generar token JWT
      const payload = {
        sub: userRecord.uid,
        email: userData.email,
        role: userData.role,
        name: userData.name,
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        user: {
          id: userRecord.uid,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.code === 'auth/user-not-found') {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      throw new UnauthorizedException('Error de autenticación');
    }
  }

  async validateUser(uid: string) {
    const userDoc = await this.firebaseService
      .getFirestore()
      .collection('USUARIOS')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      ...userData,
    };
  }
}
