import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateFincaDto } from './dto/create-finca.dto';

@Injectable()
export class FincasService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createFincaDto: CreateFincaDto) {
    const docRef = await this.firebaseService.getFirestore().collection('FINCA').add(createFincaDto);
    return { id: docRef.id, ...createFincaDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('FINCA').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore().collection('FINCA').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateFincaDto: Partial<CreateFincaDto>) {
    await this.firebaseService.getFirestore().collection('FINCA').doc(id).update(updateFincaDto);
    return { id, ...updateFincaDto };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('FINCA').doc(id).delete();
    return { id };
  }
}
