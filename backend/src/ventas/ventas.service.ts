import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateVentaDto } from './dto/create-venta.dto';

@Injectable()
export class VentasService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createVentaDto: CreateVentaDto) {
    const firestore = this.firebaseService.getFirestore();
    
    // Validar que haya suficientes aves disponibles
    const loteDoc = await firestore.collection('LOTE').doc(createVentaDto.lote_id).get();
    
    if (!loteDoc.exists) {
      throw new NotFoundException('Lote no encontrado');
    }
    
    const loteData = loteDoc.data() as any;
    const poblacionActual = loteData.poblacion_actual !== undefined ? loteData.poblacion_actual : loteData.poblacion_inicial;
    
    if (createVentaDto.cantidad > poblacionActual) {
      throw new BadRequestException(`No hay suficientes aves disponibles. Población actual: ${poblacionActual}, intentando vender: ${createVentaDto.cantidad}`);
    }
    
    const docRef = await firestore.collection('VENTAS').add({
      ...createVentaDto,
      fecha_creacion: new Date(),
    });

    // Actualizar población del lote tras la venta
    await this.actualizarPoblacionLote(createVentaDto.lote_id, createVentaDto.cantidad);

    return { id: docRef.id, ...createVentaDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('VENTAS')
      .orderBy('fecha', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('VENTAS')
      .where('lote_id', '==', loteId)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async actualizarPoblacionLote(loteId: string, cantidadVendida: number) {
    const loteDoc = await this.firebaseService.getFirestore()
      .collection('LOTE')
      .doc(loteId)
      .get();
    
    if (loteDoc.exists) {
      const loteData = loteDoc.data() as any;
      const poblacionBase = loteData.poblacion_actual !== undefined ? loteData.poblacion_actual : loteData.poblacion_inicial;
      const nuevaPoblacion = Math.max(0, poblacionBase - cantidadVendida);
      
      const updateData: any = { poblacion_actual: nuevaPoblacion };
      
      // Si la población llega a 0, finalizar el lote automáticamente
      if (nuevaPoblacion === 0) {
        updateData.activo = false;
        updateData.fecha_finalizacion = new Date().toISOString();
      }
      
      await this.firebaseService.getFirestore()
        .collection('LOTE')
        .doc(loteId)
        .update(updateData);
    }
  }
}
