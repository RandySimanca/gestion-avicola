import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirebaseService } from './firebase/firebase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);
  const db = firebaseService.getFirestore();

  const collections = ['LOTE', 'VENTAS', 'GASTOS', 'REGISTRO_DIARIO_PRODUCCION'];
  const DEFAULT_TIPO_NEGOCIO = 'PONEDORAS';

  console.log('Starting migration...');

  for (const colName of collections) {
    console.log(`Processing collection: ${colName}...`);
    const snapshot = await db.collection(colName).get();
    let updatedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let opCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.tipo_negocio) {
        batch.update(doc.ref, { tipo_negocio: DEFAULT_TIPO_NEGOCIO });
        opCount++;
        updatedCount++;

        if (opCount >= batchSize) {
            await batch.commit();
            batch = db.batch();
            opCount = 0;
            console.log(`  Committed batch of ${batchSize} updates for ${colName}`);
        }
      }
    }

    if (opCount > 0) {
        await batch.commit();
        console.log(`  Committed final batch of ${opCount} updates for ${colName}`);
    }

    console.log(`Completed ${colName}: ${updatedCount} documents updated.`);
  }

  console.log('Migration completed successfully.');
  await app.close();
}

bootstrap();
