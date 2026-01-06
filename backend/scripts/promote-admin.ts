import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FirebaseService } from '../src/firebase/firebase.service';
import { UserStatus } from '../src/users/enums/user.enums';

async function promoteAdmin(email: string) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);

  try {
    console.log(`Buscando usuario con email: ${email}...`);
    const userRecord = await firebaseService.getAuth().getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`Usuario encontrado (UID: ${uid}). Promoviendo a ADMIN...`);

    // 1. Set custom claims
    await firebaseService.getAuth().setCustomUserClaims(uid, { role: 'ADMIN' });

    // 2. Update Firestore document
    await firebaseService.getFirestore().collection('USUARIOS').doc(uid).update({
      role: 'ADMIN',
      estado: UserStatus.ACTIVO,
      updatedAt: new Date(),
    });

    console.log('¡Éxito! El usuario ahora es ADMIN y está ACTIVO.');
  } catch (error) {
    console.error('Error al promover usuario:', error.message);
  } finally {
    await app.close();
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Por favor, proporciona un email: npm run promote-admin user@example.com');
  process.exit(1);
}

promoteAdmin(email);
