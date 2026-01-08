import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ReportesService {
  constructor(private firebaseService: FirebaseService) {}

  async getResumenContable(loteId: string) {
    const firestore = this.firebaseService.getFirestore();

    // 1. Obtener datos del lote (para el costo inicial)
    const loteDoc = await firestore.collection('LOTE').doc(loteId).get();
    if (!loteDoc.exists) {
      throw new Error('Lote no encontrado');
    }
    const loteData = loteDoc.data() as any;
    const costoInicialAves = (loteData.precio_compra_unitario || 0) * (loteData.poblacion_inicial || 0);

    // 2. Obtener egresos (Gastos e Inversiones)
    const gastosSnapshot = await firestore.collection('GASTOS')
      .where('lote_id', '==', loteId)
      .orderBy('fecha', 'asc')
      .get();
    
    const gastosDetalle = gastosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const totalEgresos = gastosDetalle.reduce((sum, g: any) => sum + (g.total || 0), 0);

    // 3. Obtener ingresos (Ventas)
    const ventasSnapshot = await firestore.collection('VENTAS')
      .where('lote_id', '==', loteId)
      .orderBy('fecha', 'asc')
      .get();
    
    const ventasDetalle = ventasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const totalIngresos = ventasDetalle.reduce((sum, v: any) => sum + (v.total || 0), 0);
    const ganancia = totalIngresos - totalEgresos;

    return {
      lote: {
        id: loteId,
        nombre: loteData.nombre,
        poblacion_inicial: loteData.poblacion_inicial,
      },
      tablas: {
        egresos: gastosDetalle,
        ingresos: ventasDetalle
      },
      resumen: {
        total_egresos: totalEgresos,
        total_ingresos: totalIngresos,
        utilidad_neta: ganancia,
        margen_porcentaje: totalEgresos > 0 ? (ganancia / totalEgresos) * 100 : 0
      }
    };
  }

  async getResumenGlobal() {
    const firestore = this.firebaseService.getFirestore();

    // 1. Obtener todos los lotes (solo activos para el resumen)
    const lotesSnapshot = await firestore.collection('LOTE').get();
    const lotes = lotesSnapshot.docs.map(doc => doc.data() as any);
    const lotesActivos = lotes.filter(l => l.activo === true);

    // 2. Obtener todas las ventas (Ingresos Reales)
    const ventasSnapshot = await firestore.collection('VENTAS').get();
    const ventas = ventasSnapshot.docs.map(doc => doc.data() as any);
    const totalIngresos = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

    // 3. Obtener todos los gastos (Salidas de Dinero Reales)
    // Solo contamos COMPRA_LOTE, COMPRA_INSUMO y GASTO_OPERATIVO (lo que salió de caja)
    // El CONSUMO_LOTE no se resta de caja porque ya se restó al comprar el insumo
    const gastosSnapshot = await firestore.collection('GASTOS').get();
    const gastos = gastosSnapshot.docs.map(doc => doc.data() as any);
    
    const totalEgresosCaja = gastos
      .filter((g: any) => {
        const tipoGasto = g.tipo_gasto;
        // Incluir compras (lotes e insumos) y gastos operativos
        // Excluir CONSUMO_LOTE porque ya se restó al comprar el insumo
        return tipoGasto === 'COMPRA_LOTE' || 
               tipoGasto === 'COMPRA_INSUMO' || 
               tipoGasto === 'GASTO_OPERATIVO' ||
               ['NOMINA', 'SERVICIOS_PUBLICOS', 'ARRIENDO', 'MANTENIMIENTO', 'ASEO', 'OTRO'].includes(tipoGasto);
      })
      .reduce((sum: number, g: any) => sum + (g.total || 0), 0);

    // 4. Valor del Inventario (Dinero "quieto")
    const insumosSnapshot = await firestore.collection('INSUMO').get();
    const insumos = insumosSnapshot.docs.map(doc => doc.data() as any);
    const valorInventario = insumos.reduce((sum, i) => sum + ((i.stock_actual || 0) * (i.precio_unitario || 0)), 0);

    const cajaActual = totalIngresos - totalEgresosCaja;

    return {
      resumen: {
        total_lotes: lotesActivos.length,
        total_aves_inicial: lotesActivos.reduce((sum, l) => sum + (l.poblacion_inicial || 0), 0),
      },
      contabilidad: {
        total_ingresos: totalIngresos,
        total_egresos_caja: totalEgresosCaja,
        caja_actual: cajaActual,
        valor_inventario: valorInventario
      },
      resultado: {
        ganancia_neta: cajaActual + valorInventario, // Valor real del negocio
        margen_porcentaje: totalEgresosCaja > 0 ? (cajaActual / totalEgresosCaja) * 100 : 0
      }
    };
  }
}
