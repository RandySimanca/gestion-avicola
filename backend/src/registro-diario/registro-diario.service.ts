import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';

@Injectable()
export class RegistroDiarioService {
  constructor(private firebaseService: FirebaseService) {}

  async create(createRegistroDiarioDto: CreateRegistroDiarioDto) {
    const firestore = this.firebaseService.getFirestore();
    console.log('Creando registro diario:', createRegistroDiarioDto);
    
    // Crear el registro diario principal
    const docRef = await firestore.collection('REGISTRO_DIARIO_PRODUCCION').add({
      ...createRegistroDiarioDto,
      fecha_creacion: new Date(),
    });
    console.log('Registro creado con ID:', docRef.id);

    // Si es un lote de engorde, crear registro específico
    if (createRegistroDiarioDto.peso_promedio_g) {
      await firestore.collection('REGISTRO_ENGORDE').add({
        registro_diario_id: docRef.id,
        peso_promedio_g: createRegistroDiarioDto.peso_promedio_g,
        ica_acumulado: 0,
        conversion_alimenticia_actual: 0,
        ganancia_peso_diaria_g: 0,
      });
    }

    // Si es un lote de ponedoras, crear registro específico
    if (createRegistroDiarioDto.huevos_totales) {
      await firestore.collection('REGISTRO_POSTURA').add({
        registro_diario_id: docRef.id,
        huevos_totales: createRegistroDiarioDto.huevos_totales,
        clasificacion_detalle: {
          grandes: 0,
          medianos: 0,
          pequeños: 0,
          rotos: 0,
        },
        porcentaje_postura: 0,
        peso_promedio_huevo_g: 0,
      });
    }

    // Actualizar población del lote si hay mortalidad
    if (createRegistroDiarioDto.mortalidad_dia > 0) {
      await this.actualizarPoblacionLote(createRegistroDiarioDto.lote_id, createRegistroDiarioDto.mortalidad_dia);
    }

    return { id: docRef.id, ...createRegistroDiarioDto };
  }

  async findAll() {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('REGISTRO_DIARIO_PRODUCCION')
      .get();
    
    const registros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    return registros.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA;
    });
  }

  async findByLote(loteId: string) {
    console.log('Buscando registros para lote ID:', loteId);
    const snapshot = await this.firebaseService.getFirestore()
      .collection('REGISTRO_DIARIO_PRODUCCION')
      .where('lote_id', '==', loteId)
      .get();
    
    console.log(`Se encontraron ${snapshot.size} registros en Firestore`);
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      console.log('Registro encontrado:', { id: doc.id, lote_id: d.lote_id, fecha: d.fecha });
      return { id: doc.id, ...d };
    });
    
    return data.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async findOne(id: string) {
    const doc = await this.firebaseService.getFirestore()
      .collection('REGISTRO_DIARIO_PRODUCCION')
      .doc(id)
      .get();
    
    if (!doc.exists) {
      return null;
    }
    
    return { id: doc.id, ...doc.data() };
  }

  async update(id: string, updateRegistroDiarioDto: Partial<CreateRegistroDiarioDto>) {
    await this.firebaseService.getFirestore()
      .collection('REGISTRO_DIARIO_PRODUCCION')
      .doc(id)
      .update(updateRegistroDiarioDto);
    
    return { id, ...updateRegistroDiarioDto };
  }

  async remove(id: string) {
    await this.firebaseService.getFirestore()
      .collection('REGISTRO_DIARIO_PRODUCCION')
      .doc(id)
      .delete();
    
    return { id };
  }

  private async actualizarPoblacionLote(loteId: string, mortalidad: number) {
    const loteDoc = await this.firebaseService.getFirestore()
      .collection('LOTE')
      .doc(loteId)
      .get();
    
    if (loteDoc.exists) {
      const loteData = loteDoc.data() as any;
      const poblacionBase = loteData.poblacion_actual !== undefined ? loteData.poblacion_actual : loteData.poblacion_inicial;
      const nuevaPoblacion = Math.max(0, poblacionBase - mortalidad);
      
      await this.firebaseService.getFirestore()
        .collection('LOTE')
        .doc(loteId)
        .update({ poblacion_actual: nuevaPoblacion });
    }
  }

  async getRegistrosEngorde(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('REGISTRO_ENGORDE')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getRegistrosPostura(loteId: string) {
    const snapshot = await this.firebaseService.getFirestore()
      .collection('REGISTRO_POSTURA')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async calcularKPIsLote(loteId: string) {
    const registros = await this.findByLote(loteId);
    const loteDoc = await this.firebaseService.getFirestore()
      .collection('LOTE')
      .doc(loteId)
      .get();
    
    if (!loteDoc.exists || registros.length === 0) {
      return null;
    }

    const loteData = loteDoc.data() as any;
    
    const mortalidadTotal = registros.reduce((sum, reg) => sum + (reg as any).mortalidad_dia, 0);
    const tasaMortalidad = (mortalidadTotal / loteData.poblacion_inicial) * 100;

    const alimentoTotal = registros.reduce((sum, reg) => sum + (reg as any).alimento_consumido_kg, 0);
    const pesoPromedioActual = registros.reduce((sum, reg) => sum + ((reg as any).peso_promedio_g || 0), 0) / registros.length;
    const pesoTotal = (pesoPromedioActual * loteData.poblacion_actual) / 1000;
    const icaAcumulado = pesoTotal > 0 ? alimentoTotal / pesoTotal : 0;

    const esPonedora = loteData.tipo_ave === 'PONEDORA';
    let posturaSemanal = 0;
    
    if (esPonedora) {
      const ultimoDia = new Date();
      const sieteDiasAtras = new Date(ultimoDia.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const registrosSemanales = registros.filter(reg => {
        const fechaReg = new Date((reg as any).fecha);
        return fechaReg >= sieteDiasAtras && fechaReg <= ultimoDia;
      });
      
      const huevosSemanales = registrosSemanales.reduce((sum, reg) => sum + ((reg as any).huevos_totales || 0), 0);
      const poblacionPromedio = registrosSemanales.length > 0 
        ? registrosSemanales.reduce((sum) => sum + loteData.poblacion_actual, 0) / registrosSemanales.length
        : loteData.poblacion_actual;
      
      posturaSemanal = poblacionPromedio > 0 ? (huevosSemanales / poblacionPromedio) * 100 : 0;
    }

    return {
      lote_id: loteId,
      tasa_mortalidad_porcentual: Number(tasaMortalidad.toFixed(2)),
      ica_acumulado: Number(icaAcumulado.toFixed(3)),
      postura_semanal_porcentual: esPonedora ? Number(posturaSemanal.toFixed(2)) : undefined,
      dias_en_produccion: this.calcularDiasProduccion(loteData.fecha_ingreso),
      mortalidad_acumulada: mortalidadTotal,
      alimento_consumido_total: alimentoTotal,
    };
  }

  async getGlobalKPIs() {
    const firestore = this.firebaseService.getFirestore();
    
    // 1. Obtener todos los lotes activos
    const lotesSnapshot = await firestore.collection('LOTE').get();
    const todosLosLotes = lotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    const lotes = todosLosLotes.filter(lote => lote.activo === true);
    const lotesActivos = lotes.length;

    // 2. Obtener todos los registros diarios para cálculos
    const registrosSnapshot = await firestore.collection('REGISTRO_DIARIO_PRODUCCION').get();
    const todosLosRegistros = registrosSnapshot.docs.map(doc => doc.data() as any);

    const ventasSnapshot = await firestore.collection('VENTAS').get();
    const todasLasVentas = ventasSnapshot.docs.map(doc => doc.data() as any);

    // 3. Calcular Población Total Real solo de lotes activos
    let totalAves = 0;
    lotes.forEach(lote => {
      const mortalidadLote = todosLosRegistros
        .filter(reg => reg.lote_id === lote.id)
        .reduce((sum, reg) => sum + (reg.mortalidad_dia || 0), 0);
      
      const ventasLote = todasLasVentas
        .filter(venta => venta.lote_id === lote.id)
        .reduce((sum, venta) => sum + (venta.cantidad || 0), 0);
      
      const poblacionReal = Math.max(0, (lote.poblacion_inicial || 0) - mortalidadLote - ventasLote);
      totalAves += poblacionReal;
    });

    // 4. Producción de Hoy - Solo huevos de lotes de PONEDORA activos
    const hoy = new Date();
    const hoyIso = hoy.toISOString().split('T')[0];
    
    const lotesPonetrasActivos = lotes.filter(l => l.tipo_ave === 'PONEDORA');
    const lotesPonetrasIds = new Set(lotesPonetrasActivos.map(l => l.id));
    
    const produccionHoy = todosLosRegistros
      .filter(reg => {
        const fechaReg = reg.fecha ? reg.fecha.split('T')[0] : '';
        return fechaReg === hoyIso && lotesPonetrasIds.has(reg.lote_id);
      })
      .reduce((sum, reg) => sum + (reg.huevos_totales || 0), 0);

    // 5. Mortalidad Semanal - Solo de lotes activos
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
    sieteDiasAtras.setHours(0, 0, 0, 0);

    const lotesActivosIds = new Set(lotes.map(l => l.id));
    
    const mortalidadSemanal = todosLosRegistros
      .filter(reg => {
        if (!lotesActivosIds.has(reg.lote_id)) return false;
        const fechaReg = new Date(reg.fecha);
        return fechaReg >= sieteDiasAtras;
      })
      .reduce((sum, reg) => sum + (reg.mortalidad_dia || 0), 0);

    console.log('Dashboard KPIs:', {
      totalAves,
      produccionHoy,
      mortalidadSemanal,
      lotesActivos,
      hoyIso,
      registrosFiltrados: todosLosRegistros.filter(reg => {
        const fechaReg = new Date(reg.fecha);
        return fechaReg >= sieteDiasAtras && lotesActivosIds.has(reg.lote_id);
      }).length
    });

    return {
      totalAves,
      produccionHoy,
      mortalidadSemanal,
      lotesActivos,
      fechaActualizacion: new Date().toISOString()
    };
  }

  private calcularDiasProduccion(fechaIngreso: any): number {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - ingreso.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}