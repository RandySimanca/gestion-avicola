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

async function checkLotes() {
  console.log('Checking LOTE collection...');
  const snapshot = await db.collection('LOTE').get();
  console.log(`Found ${snapshot.size} lotes`);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });

  console.log('\nChecking FINCA collection...');
  const fincaSnapshot = await db.collection('FINCA').get();
  console.log(`Found ${fincaSnapshot.size} fincas`);
  
  console.log('\nChecking GALPON collection...');
  const galponSnapshot = await db.collection('GALPON').get();
  console.log(`Found ${galponSnapshot.size} galpones`);
}

checkLotes().catch(console.error);
