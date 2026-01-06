import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProgramaSanitarioDto } from './dto/create-programa-sanitario.dto';
import { CreateAplicacionSanitariaDto } from './dto/create-aplicacion-sanitaria.dto';

@Injectable()
export class SanidadService {
  constructor(private firebaseService: FirebaseService) {}

  // Programa Sanitario
  async createPrograma(createProgramaSanitarioDto: CreateProgramaSanitarioDto) {
    const docRef = await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .add({
        ...createProgramaSanitarioDto,
        fecha_creacion: new Date(),
        activo: true,
      });

    return { id: docRef.id, ...createProgramaSanitarioDto };
  }

  async findAllProgramas() {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .orderBy('etapa_aplicacion')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findProgramasByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .where('lote_id', '==', loteId)
      .where('activo', '==', true)
      .orderBy('edad_aplicacion_dias')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findProgramasPendientes(loteId: string, edadActualDias: number) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .where('lote_id', '==', loteId)
      .where('edad_aplicacion_dias', '<=', edadActualDias + 7) // Próximos 7 días
      .where('activo', '==', true)
      .orderBy('edad_aplicacion_dias')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updatePrograma(id: string, updateProgramaDto: Partial<CreateProgramaSanitarioDto>) {
    await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .doc(id)
      .update(updateProgramaDto);
    
    return { id, ...updateProgramaDto };
  }

  async removePrograma(id: string) {
    await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .doc(id)
      .update({ activo: false });
    
    return { id };
  }

  // Aplicación Sanitaria
  async createAplicacion(createAplicacionSanitariaDto: CreateAplicacionSanitariaDto) {
    const docRef = await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .add({
        ...createAplicacionSanitariaDto,
        fecha_creacion: new Date(),
      });

    // Actualizar inventario de insumos si aplica
    await this.actualizarInventarioSanitario(createAplicacionSanitariaDto);

    return { id: docRef.id, ...createAplicacionSanitariaDto };
  }

  async findAllAplicaciones() {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .orderBy('fecha_aplicacion', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findAplicacionesByLote(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .where('lote_id', '==', loteId)
      .orderBy('fecha_aplicacion', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async findAplicacionesByPrograma(programaSanitarioId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .where('programa_sanitario_id', '==', programaSanitarioId)
      .orderBy('fecha_aplicacion', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateAplicacion(id: string, updateAplicacionDto: Partial<CreateAplicacionSanitariaDto>) {
    await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .doc(id)
      .update(updateAplicacionDto);
    
    return { id, ...updateAplicacionDto };
  }

  async removeAplicacion(id: string) {
    await this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .doc(id)
      .delete();
    
    return { id };
  }

  // Métodos de utilidad
  async getHistorialSanitarioLote(loteId: string) {
    const aplicaciones = await this.findAplicacionesByLote(loteId);
    const programas = await this.findProgramasByLote(loteId);

    return {
      programas_programados: programas,
      aplicaciones_realizadas: aplicaciones,
    };
  }

  async getCalendarioSanitario(loteId: string) {
    const programas = await this.findProgramasByLote(loteId);
    const aplicaciones = await this.findAplicacionesByLote(loteId);
    
    const calendario = programas.map((programa: any) => {
      const aplicacion = aplicaciones.find((app: any) => app.programa_sanitario_id === programa.id);
      
      return {
        ...programa,
        estado: aplicacion ? 'aplicado' : 'pendiente',
        fecha_aplicacion_real: (aplicacion as any)?.fecha_aplicacion,
        aplicado_por: (aplicacion as any)?.aplicado_por,
        costo_real: (aplicacion as any)?.costo_aplicacion,
      };
    });

    return calendario;
  }

  private async actualizarInventarioSanitario(aplicacion: CreateAplicacionSanitariaDto) {
    // Buscar el programa para obtener detalles del medicamento/vacuna
    const programaDoc = await this.firebaseService.getFirestore()
      .collection('PROGRAMA_SANITARIO')
      .doc(aplicacion.programa_sanitario_id)
      .get();

    if (programaDoc.exists) {
      const programaData = programaDoc.data() as any;
      const nombreInsumo = programaData.vacuna_medicamento;

      // Buscar el insumo en el inventario
      const insumosSnapshot = await this.firebaseService.getFirestore()
        .collection('INSUMO')
        .where('nombre_producto', '==', nombreInsumo)
        .limit(1)
        .get();

      if (!insumosSnapshot.empty) {
        const insumoDoc = insumosSnapshot.docs[0];
        const insumoData = insumoDoc.data() as any;
        
        // Actualizar stock
        const nuevoStock = Math.max(0, insumoData.stock_actual - aplicacion.cantidad_aplicada);
        
        await this.firebaseService.getFirestore()
          .collection('INSUMO')
          .doc(insumoDoc.id)
          .update({ stock_actual: nuevoStock });

        // Crear registro de consumo
        await this.firebaseService.getFirestore()
          .collection('CONSUMO_INSUMO')
          .add({
            lote_id: aplicacion.lote_id,
            insumo_id: insumoDoc.id,
            cantidad_consumida: aplicacion.cantidad_aplicada,
            costo_total_lote: aplicacion.costo_aplicacion,
            fecha_consumo: aplicacion.fecha_aplicacion,
            aplicado_por: aplicacion.aplicado_por,
            tipo_consumo: 'SANIDAD',
          });
      }
    }
  }

  async getReporteSanidad(loteId: string, fechaInicio?: Date, fechaFin?: Date) {
    let query = this.firebaseService.getFirestore()
      .collection('APLICACION_SANITARIA')
      .where('lote_id', '==', loteId);

    if (fechaInicio) {
      query = query.where('fecha_aplicacion', '>=', fechaInicio);
    }

    if (fechaFin) {
      query = query.where('fecha_aplicacion', '<=', fechaFin);
    }

    const snapshot = await query.orderBy('fecha_aplicacion', 'asc').get();
    const aplicaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcular totales
    const costoTotal = aplicaciones.reduce((sum, app) => sum + (app as any).costo_aplicacion, 0);
    const totalAplicaciones = aplicaciones.length;

    // Agrupar por tipo de tratamiento
    const tratamientos = aplicaciones.reduce((acc: any, app: any) => {
      const tipo = (app as any).vacuna_medicamento || 'No especificado';
      if (!acc[tipo]) {
        acc[tipo] = { count: 0, costo: 0 };
      }
      acc[tipo].count++;
      acc[tipo].costo += (app as any).costo_aplicacion;
      return acc;
    }, {});

    return {
      lote_id: loteId,
      periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      resumen: {
        total_aplicaciones: totalAplicaciones,
        costo_total: costoTotal,
        costo_promedio_por_aplicacion: totalAplicaciones > 0 ? costoTotal / totalAplicaciones : 0,
      },
      tratamientos_aplicados: tratamientos,
      detalle_aplicaciones: aplicaciones,
    };
  }
}
