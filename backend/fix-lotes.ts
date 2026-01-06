import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Firebase config missing');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

async function fixLotes() {
  console.log('Fixing LOTE collection...');
  const snapshot = await db.collection('LOTE').get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (isNaN(data.poblacion_actual)) {
      console.log(`Fixing NaN in lote ${doc.id}`);
      await doc.ref.update({
        poblacion_actual: data.poblacion_inicial || 0
      });
    }
  }
  console.log('Done');
}

fixLotes().catch(console.error);
