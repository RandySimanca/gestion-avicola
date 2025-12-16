import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class LotesService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createLoteDto: CreateLoteDto) {
    const docRef = await this.firebaseService.getFirestore().collection('LOTE').add(createLoteDto);
    return { id: docRef.id, ...createLoteDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('LOTE').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore().collection('LOTE').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateLoteDto: Partial<CreateLoteDto>) {
    await this.firebaseService.getFirestore().collection('LOTE').doc(id).update(updateLoteDto);
    return { id, ...updateLoteDto };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('LOTE').doc(id).delete();
    return { id };
  }
}
