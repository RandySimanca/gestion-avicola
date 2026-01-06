import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseService } from './firebase/firebase.service';
import { UserStatus } from './users/enums/user.enums';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);

  const email = 'randysimancamercado@gmail.com';

  try {
    console.log(`Checking user: ${email}`);
    
    // 1. Check Firebase Auth
    const userRecord = await firebaseService.getAuth().getUserByEmail(email);
    console.log(`✅ User found in Firebase Auth: ${userRecord.uid}`);

    // 2. Check Firestore
    const userDoc = await firebaseService.getFirestore().collection('USUARIOS').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      console.log('✅ User found in Firestore:', userDoc.data());
    } else {
      console.log('❌ User NOT found in Firestore. Creating document...');
      await firebaseService.getFirestore().collection('USUARIOS').doc(userRecord.uid).set({
        email,
        name: 'Randy Simanca',
        role: 'ADMIN',
        estado: UserStatus.ACTIVO,
        createdAt: new Date(),
      });
      console.log('✅ Firestore document created successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Tip: Create the user in Firebase Console first.');
    }
  } finally {
    await app.close();
  }
}

bootstrap();
