import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastosService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createGastoDto: CreateGastoDto) {
    const firestore = this.firebaseService.getFirestore();
    
    // Si es una compra de insumo, actualizar el stock
    if (createGastoDto.insumo_id && createGastoDto.tipo_gasto === 'COMPRA_INSUMO') {
      const insumoRef = firestore.collection('INSUMO').doc(createGastoDto.insumo_id);
      const insumoDoc = await insumoRef.get();
      
      if (insumoDoc.exists) {
        const insumoData = insumoDoc.data() as any;
        const nuevoStock = (insumoData.stock_actual || 0) + createGastoDto.cantidad;
        await insumoRef.update({ 
          stock_actual: nuevoStock,
          precio_unitario: createGastoDto.precio_unitario // Actualizar precio con el de la última compra
        });
      }
    }

    const data = { ...createGastoDto, fecha_creacion: new Date() };
    const docRef = await firestore.collection('GASTOS').add(data);
    return { id: docRef.id, ...data };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('GASTOS').orderBy('fecha', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .where('lote_id', '==', loteId)
      .orderBy('fecha', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore().collection('GASTOS').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateGastoDto: UpdateGastoDto) {
    const data = { ...updateGastoDto };
    await this.firebaseService.getFirestore().collection('GASTOS').doc(id).update(data as any);
    return { id, ...data };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore().collection('GASTOS').doc(id).delete();
    return { id };
  }
}
