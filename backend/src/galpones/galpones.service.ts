import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateGalponDto } from './dto/create-galpon.dto';

@Injectable()
export class GalponesService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createGalponDto: CreateGalponDto) {
    const docRef = await this.firebaseService.getFirestore().collection('GALPON').add(createGalponDto);
    return { id: docRef.id, ...createGalponDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('GALPON').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore().collection('GALPON').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateGalponDto: Partial<CreateGalponDto>) {
    await this.firebaseService.getFirestore().collection('GALPON').doc(id).update(updateGalponDto);
    return { id, ...updateGalponDto };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('GALPON').doc(id).delete();
    return { id };
  }
}
