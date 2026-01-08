import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateCompraDto, TipoCompra } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';

@Injectable()
export class ComprasService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createCompraDto: CreateCompraDto) {
    const firestore = this.firebaseService.getFirestore();

    if (createCompraDto.tipo_compra === TipoCompra.LOTE) {
      return await this.createCompraLote(createCompraDto, firestore);
    } else if (createCompraDto.tipo_compra === TipoCompra.INSUMO) {
      return await this.createCompraInsumo(createCompraDto, firestore);
    } else {
      throw new BadRequestException('Tipo de compra no válido');
    }
  }

  private async createCompraLote(createCompraDto: CreateCompraDto, firestore: any) {
    // Validar que la finca y galpón existen
    const [fincaDoc, galponDoc] = await Promise.all([
      firestore.collection('FINCA').doc(createCompraDto.finca_id).get(),
      firestore.collection('GALPON').doc(createCompraDto.galpon_id).get(),
    ]);

    if (!fincaDoc.exists) {
      throw new NotFoundException('Finca no encontrada');
    }
    if (!galponDoc.exists) {
      throw new NotFoundException('Galpón no encontrado');
    }

    const fincaData = fincaDoc.data();
    const galponData = galponDoc.data();

    // 1. Crear el lote
    const loteData = {
      nombre: createCompraDto.nombre_lote,
      tipo_ave: createCompraDto.tipo_ave,
      poblacion_inicial: createCompraDto.poblacion_inicial,
      poblacion_actual: createCompraDto.poblacion_inicial,
      precio_compra_unitario: createCompraDto.precio_compra_unitario,
      finca_id: createCompraDto.finca_id,
      finca_nombre: fincaData.nombre,
      galpon_id: createCompraDto.galpon_id,
      galpon_nombre: galponData.nombre,
      fecha_ingreso: createCompraDto.fecha,
      activo: true,
      createdAt: new Date(),
    };

    const loteRef = await firestore.collection('LOTE').add(loteData);
    const loteId = loteRef.id;

    // 2. Crear registro en GASTOS como inversión
    const gastoData = {
      tipo_compra: 'LOTE',
      tipo_gasto: 'COMPRA_LOTE',
      categoria: 'INVERSION',
      fecha: createCompraDto.fecha,
      concepto: `Compra de lote: ${createCompraDto.nombre_lote}`,
      cantidad: createCompraDto.poblacion_inicial,
      precio_unitario: createCompraDto.precio_compra_unitario,
      total: createCompraDto.total,
      proveedor: createCompraDto.proveedor,
      metodo_pago: createCompraDto.metodo_pago,
      observaciones: createCompraDto.observaciones,
      lote_id: loteId,
      fecha_creacion: new Date(),
    };

    const gastoRef = await firestore.collection('GASTOS').add(gastoData);
    const gastoId = gastoRef.id;

    return {
      id: gastoId,
      tipo_compra: 'LOTE',
      lote_id: loteId,
      gasto_id: gastoId,
      ...gastoData,
    };
  }

  private async createCompraInsumo(createCompraDto: CreateCompraDto, firestore: any) {
    let insumoId: string;
    let insumoNombre: string;

    if (createCompraDto.insumo_id) {
      // Insumo existente: actualizar stock
      const insumoRef = firestore.collection('INSUMO').doc(createCompraDto.insumo_id);
      const insumoDoc = await insumoRef.get();

      if (!insumoDoc.exists) {
        throw new NotFoundException('Insumo no encontrado');
      }

      const insumoData = insumoDoc.data();
      insumoId = createCompraDto.insumo_id;
      insumoNombre = insumoData.nombre_producto;

      // Actualizar stock y precio
      const nuevoStock = (insumoData.stock_actual || 0) + createCompraDto.cantidad;
      await insumoRef.update({
        stock_actual: nuevoStock,
        precio_unitario: createCompraDto.precio_unitario, // Actualizar precio con el de la última compra
      });
    } else {
      // Nuevo insumo: crear en inventario
      if (!createCompraDto.nombre_insumo || !createCompraDto.tipo_insumo || !createCompraDto.unidad_medida) {
        throw new BadRequestException('Para crear un nuevo insumo se requieren: nombre, tipo y unidad de medida');
      }

      const insumoData = {
        nombre_producto: createCompraDto.nombre_insumo,
        tipo: createCompraDto.tipo_insumo,
        unidad_medida: createCompraDto.unidad_medida,
        stock_actual: createCompraDto.cantidad,
        stock_minimo: 0, // Valor por defecto
        precio_unitario: createCompraDto.precio_unitario,
        proveedor: createCompraDto.proveedor,
        createdAt: new Date(),
      };

      const insumoRef = await firestore.collection('INSUMO').add(insumoData);
      insumoId = insumoRef.id;
      insumoNombre = createCompraDto.nombre_insumo;
    }

    // Crear registro en GASTOS como inversión
    const gastoData = {
      tipo_compra: 'INSUMO',
      tipo_gasto: 'COMPRA_INSUMO',
      categoria: 'INVERSION',
      fecha: createCompraDto.fecha,
      concepto: `Compra: ${insumoNombre}`,
      cantidad: createCompraDto.cantidad,
      precio_unitario: createCompraDto.precio_unitario,
      total: createCompraDto.total,
      proveedor: createCompraDto.proveedor,
      metodo_pago: createCompraDto.metodo_pago,
      observaciones: createCompraDto.observaciones,
      insumo_id: insumoId,
      fecha_creacion: new Date(),
    };

    const gastoRef = await firestore.collection('GASTOS').add(gastoData);
    const gastoId = gastoRef.id;

    return {
      id: gastoId,
      tipo_compra: 'INSUMO',
      insumo_id: insumoId,
      gasto_id: gastoId,
      ...gastoData,
    };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .where('tipo_gasto', 'in', ['COMPRA_LOTE', 'COMPRA_INSUMO'])
      .orderBy('fecha', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .where('lote_id', '==', loteId)
      .where('tipo_gasto', '==', 'COMPRA_LOTE')
      .orderBy('fecha', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore()
      .collection('GASTOS')
      .doc(id)
      .get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    // Solo retornar si es una compra
    if (data.tipo_gasto !== 'COMPRA_LOTE' && data.tipo_gasto !== 'COMPRA_INSUMO') {
      return null;
    }
    
    return { id: doc.id, ...data };
  }

  async update(id: string, updateCompraDto: UpdateCompraDto) {
    // Por ahora, las compras no se pueden editar para mantener integridad contable
    // Si se necesita editar, se debe crear un sistema de reversión/ajuste
    throw new BadRequestException('Las compras no se pueden editar. Use un ajuste contable si es necesario.');
  }

  async remove(id: string) {
    // Por ahora, las compras no se pueden eliminar para mantener integridad contable
    // Si se necesita eliminar, se debe crear un sistema de reversión
    throw new BadRequestException('Las compras no se pueden eliminar. Use un ajuste contable si es necesario.');
  }
}
