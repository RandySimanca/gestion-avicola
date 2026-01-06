import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseService } from './firebase/firebase.service';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const firebaseService = app.get(FirebaseService);
    const db = firebaseService.getFirestore();

    const snapshot = await db.collection('USUARIOS').get();
    console.log(`TOTAL_USERS_COUNT: ${snapshot.size}`);
    
    snapshot.forEach(doc => {
      console.log(`USER_ID: ${doc.id}, EMAIL: ${doc.data().email}, ESTADO: ${doc.data().estado}`);
    });

    await app.close();
  } catch (error) {
    console.error('DIAGNOSTIC_ERROR:', error);
  }
}

bootstrap();
