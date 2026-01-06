import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createInsumoDto: CreateInsumoDto) {
    // Convertimos el DTO (instancia de clase) a objeto plano para Firestore
    const data = { ...createInsumoDto };
    const docRef = await this.firebaseService.getFirestore().collection('INSUMO').add(data);
    return { id: docRef.id, ...data };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('INSUMO').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore().collection('INSUMO').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateInsumoDto: UpdateInsumoDto) {
    // Convertimos el DTO a objeto plano para evitar errores en Firestore
    const data = { ...updateInsumoDto };
    await this.firebaseService.getFirestore().collection('INSUMO').doc(id).update(data as any);
    return { id, ...data };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('INSUMO').doc(id).delete();
    return { id };
  }
}