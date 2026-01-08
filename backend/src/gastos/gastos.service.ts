import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastosService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createGastoDto: CreateGastoDto) {
    const firestore = this.firebaseService.getFirestore();

    // Crear registro de gasto operativo
    const data = {
      ...createGastoDto,
      categoria: 'GASTO', // Todos los gastos operativos son GASTO (no INVERSION)
      tipo_gasto: createGastoDto.tipo_gasto, // NOMINA, SERVICIOS_PUBLICOS, etc.
      fecha_creacion: new Date(),
    };

    const docRef = await firestore.collection('GASTOS').add(data);
    return { id: docRef.id, ...data };
  }

  async findAll() {
    // Obtener todos los gastos y filtrar solo los operativos
    const snapshot = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .orderBy('fecha', 'desc')
      .get();
    
    // Filtrar solo gastos operativos (excluir compras y consumos)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((gasto: any) => {
        const tipoGasto = gasto.tipo_gasto;
        return tipoGasto && 
               tipoGasto !== 'COMPRA_LOTE' && 
               tipoGasto !== 'COMPRA_INSUMO' && 
               tipoGasto !== 'CONSUMO_LOTE';
      });
  }

  async findByLote(loteId: string) {
    // Obtener gastos asociados a un lote y filtrar solo los operativos
    const snapshot = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .where('lote_id', '==', loteId)
      .orderBy('fecha', 'desc')
      .get();
    
    // Filtrar solo gastos operativos
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((gasto: any) => {
        const tipoGasto = gasto.tipo_gasto;
        return tipoGasto && 
               tipoGasto !== 'COMPRA_LOTE' && 
               tipoGasto !== 'COMPRA_INSUMO' && 
               tipoGasto !== 'CONSUMO_LOTE';
      });
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
