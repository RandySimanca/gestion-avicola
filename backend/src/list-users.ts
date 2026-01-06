import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseService } from './firebase/firebase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);
  const db = firebaseService.getFirestore();

  console.log('--- LISTADO DE USUARIOS EN FIRESTORE ---');
  const snapshot = await db.collection('USUARIOS').get();
  
  if (snapshot.empty) {
    console.log('No se encontraron usuarios en la colección USUARIOS.');
  } else {
    snapshot.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(`Datos:`, doc.data());
      console.log('-----------------------------------');
    });
  }

  await app.close();
}

bootstrap();
