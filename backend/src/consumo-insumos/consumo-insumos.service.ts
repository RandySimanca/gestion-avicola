import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateConsumoInsumoDto } from './dto/create-consumo-insumo.dto';

@Injectable()
export class ConsumoInsumosService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createConsumoInsumoDto: CreateConsumoInsumoDto) {
    const firestore = this.firebaseService.getFirestore();
    
    // 1. Verificar que el insumo existe y obtener su precio
    const insumoDoc = await firestore.collection('INSUMO').doc(createConsumoInsumoDto.insumo_id).get();
    if (!insumoDoc.exists) {
      throw new NotFoundException('Insumo no encontrado');
    }
    
    const insumoData = insumoDoc.data() as any;
    const precioUnitario = insumoData.precio_unitario || 0;
    const costoTotal = precioUnitario * createConsumoInsumoDto.cantidad;

    // 2. Registrar el consumo
    const consumoData = {
      ...createConsumoInsumoDto,
      precio_unitario: precioUnitario,
      costo_total: costoTotal,
      tipo_insumo: insumoData.tipo,
      fecha_creacion: new Date(),
    };

    const docRef = await firestore.collection('CONSUMO_INSUMO').add(consumoData);

    // 3. Actualizar el stock del insumo
    const nuevoStock = Math.max(0, insumoData.stock_actual - createConsumoInsumoDto.cantidad);
    await firestore.collection('INSUMO').doc(createConsumoInsumoDto.insumo_id).update({
      stock_actual: nuevoStock
    });

    // 4. Crear registro automático en GASTOS para el lote
    const gastoData = {
      lote_id: createConsumoInsumoDto.lote_id,
      fecha: createConsumoInsumoDto.fecha,
      concepto: `Consumo: ${insumoData.nombre}`,
      categoria: 'GASTO',
      cantidad: createConsumoInsumoDto.cantidad,
      precio_unitario: precioUnitario,
      total: costoTotal,
      tipo_gasto: 'CONSUMO_LOTE',
      insumo_id: createConsumoInsumoDto.insumo_id,
      fecha_creacion: new Date(),
    };
    await firestore.collection('GASTOS').add(gastoData);

    return { id: docRef.id, ...consumoData };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore().collection('CONSUMO_INSUMO').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('CONSUMO_INSUMO')
      .where('lote_id', '==', loteId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
