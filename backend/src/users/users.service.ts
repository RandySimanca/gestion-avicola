import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role } = createUserDto;
    
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
      createdAt: new Date(),
    });

    return { uid: userRecord.uid, ...createUserDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('USUARIOS').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
