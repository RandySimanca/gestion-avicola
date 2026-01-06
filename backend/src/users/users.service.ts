import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from './enums/user.enums';

@Injectable()
export class UsersService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role, estado } = createUserDto;
    
    // 1. Create user in Firebase Auth
    const userRecord = await this.firebaseService.getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set custom claims for role
    await this.firebaseService.getAuth().setCustomUserClaims(userRecord.uid, { role });

    // 3. Create user document in Firestore 'USUARIOS' collection
    await this.firebaseService.getFirestore().collection('USUARIOS').doc(userRecord.uid).set({
      email,
      name,
      role,
      estado: estado || UserStatus.ACTIVO, // Por defecto ACTIVO cuando lo crea un admin
      createdAt: new Date(),
    });

    return { uid: userRecord.uid, ...createUserDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('USUARIOS').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getPendingUsers() {
    const snapshot = await this.firebaseService
      .getFirestore()
      .collection('USUARIOS')
      .where('estado', '==', UserStatus.PENDIENTE)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async approveUser(id: string) {
    const userRef = this.firebaseService.getFirestore().collection('USUARIOS').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await userRef.update({
      estado: UserStatus.ACTIVO,
      approvedAt: new Date(),
    });

    return { message: 'Usuario aprobado exitosamente', id };
  }

  async rejectUser(id: string) {
    const userRef = this.firebaseService.getFirestore().collection('USUARIOS').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await userRef.update({
      estado: UserStatus.RECHAZADO,
      rejectedAt: new Date(),
    });

    return { message: 'Usuario rechazado', id };
  }

  async toggleUserStatus(id: string) {
    const userRef = this.firebaseService.getFirestore().collection('USUARIOS').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userData = userDoc.data();
    const newStatus = userData.estado === UserStatus.ACTIVO 
      ? UserStatus.INACTIVO 
      : UserStatus.ACTIVO;

    await userRef.update({
      estado: newStatus,
      updatedAt: new Date(),
    });

    return { message: `Usuario ${newStatus === UserStatus.ACTIVO ? 'activado' : 'desactivado'}`, id, estado: newStatus };
  }

  async updateRole(id: string, role: string) {
    const userRef = this.firebaseService.getFirestore().collection('USUARIOS').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 1. Update Custom Claims in Firebase Auth
    await this.firebaseService.getAuth().setCustomUserClaims(id, { role });

    // 2. Update Firestore document
    await userRef.update({
      role,
      updatedAt: new Date(),
    });

    return { message: 'Rol actualizado exitosamente', id, role };
  }

  async remove(id: string) {
    // 1. Delete from Firebase Auth
    try {
      await this.firebaseService.getAuth().deleteUser(id);
    } catch (error) {
      console.error(`Error deleting user from Auth: ${error.message}`);
      // Continue even if auth deletion fails (user might not exist in auth but in firestore)
    }

    // 2. Delete from Firestore
    const userRef = this.firebaseService.getFirestore().collection('USUARIOS').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new NotFoundException('Usuario no encontrado en Firestore');
    }

    await userRef.delete();

    return { message: 'Usuario eliminado exitosamente', id };
  }
}

