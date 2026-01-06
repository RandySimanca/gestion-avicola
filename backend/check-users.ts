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

async function checkUsers() {
  console.log('Checking USUARIOS collection...');
  const snapshot = await db.collection('USUARIOS').get();
  console.log(`Found ${snapshot.size} users`);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

checkUsers().catch(console.error);
