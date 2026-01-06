import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class LotesService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createLoteDto: CreateLoteDto) {
    const data = {
      ...createLoteDto,
      poblacion_actual: createLoteDto.poblacion_actual ?? createLoteDto.poblacion_inicial,
      precio_compra_unitario: createLoteDto.precio_compra_unitario ?? 0,
      activo: createLoteDto.activo ?? true,
      createdAt: new Date(),
    };
    const docRef = await this.firebaseService.getFirestore().collection('LOTE').add(data);
    return { id: docRef.id, ...data };
  }

  async findAll() {
    const firestore = this.firebaseService.getFirestore();
    
    // Obtener lotes, fincas y galpones en paralelo para eficiencia
    const [lotesSnap, fincasSnap, galponesSnap] = await Promise.all([
      firestore.collection('LOTE').get(),
      firestore.collection('FINCA').get(),
      firestore.collection('GALPON').get(),
    ]);

    const fincasMap = new Map();
    fincasSnap.docs.forEach(doc => fincasMap.set(doc.id, doc.data()));

    const galponesMap = new Map();
    galponesSnap.docs.forEach(doc => galponesMap.set(doc.id, doc.data()));

    const lotes = lotesSnap.docs.map(doc => {
      const data = doc.data();
      const finca = fincasMap.get(data.finca_id);
      const galpon = galponesMap.get(data.galpon_id);

      return {
        id: doc.id,
        ...data,
        finca_nombre: finca ? finca.nombre : 'N/A',
        galpon_nombre: galpon ? galpon.nombre : 'N/A',
      };
    });

    console.log(`Lotes found in DB with joined data: ${lotes.length}`);
    return lotes;
  }

  async findOne(id: string) {
    const firestore = this.firebaseService.getFirestore();
    const doc = await firestore.collection('LOTE').doc(id).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    
    // Obtener info de finca y galpón
    const [fincaDoc, galponDoc] = await Promise.all([
      firestore.collection('FINCA').doc(data.finca_id).get(),
      firestore.collection('GALPON').doc(data.galpon_id).get(),
    ]);

    const fincaData = fincaDoc.exists ? fincaDoc.data() : null;
    const galponData = galponDoc.exists ? galponDoc.data() : null;

    return { 
      id: doc.id, 
      ...data,
      finca_nombre: fincaData ? fincaData.nombre : 'N/A',
      galpon_nombre: galponData ? galponData.nombre : 'N/A',
    };
  }

  async update(id: string, updateLoteDto: Partial<CreateLoteDto>) {
    const data = { ...updateLoteDto };
    await this.firebaseService.getFirestore().collection('LOTE').doc(id).update(data);
    return { id, ...data };
  }

  async finalize(id: string) {
    const firestore = this.firebaseService.getFirestore();
    const loteRef = firestore.collection('LOTE').doc(id);
    const loteDoc = await loteRef.get();

    if (!loteDoc.exists) {
      throw new Error('Lote no encontrado');
    }

    const data = {
      activo: false,
      fecha_finalizacion: new Date().toISOString(),
    };

    await loteRef.update(data);
    return { id, ...data };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('LOTE').doc(id).delete();
    return { id };
  }
}
