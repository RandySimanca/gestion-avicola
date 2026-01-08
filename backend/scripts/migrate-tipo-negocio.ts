import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FirebaseService } from '../src/firebase/firebase.service';

async function migrateTipoNegocio() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firebaseService = app.get(FirebaseService);
  const db = firebaseService.getFirestore();

  try {
    console.log('🔄 Iniciando migración de tipo_negocio...');

    // 1. Migrar LOTES
    const lotesSnapshot = await db.collection('LOTE').get();
    const loteBatch = db.batch();
    const lotesMap = new Map();
    
    lotesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Si es PONEDORA, va a PONEDORAS, si es ENGORDE va a DESCARTE
      const tipoNegocio = data.tipo_ave === 'PONEDORA' ? 'PONEDORAS' : 'DESCARTE';
      loteBatch.update(doc.ref, { tipo_negocio: tipoNegocio });
      lotesMap.set(doc.id, tipoNegocio);
    });
    
    await loteBatch.commit();
    console.log(`✅ ${lotesSnapshot.size} Lotes migrados`);

    // 2. Migrar VENTAS
    const ventasSnapshot = await db.collection('VENTAS').get();
    const ventaBatch = db.batch();
    let ventasCount = 0;
    
    ventasSnapshot.docs.forEach(doc => {
      const venta = doc.data();
      if (venta.lote_id && lotesMap.has(venta.lote_id)) {
        ventaBatch.update(doc.ref, { tipo_negocio: lotesMap.get(venta.lote_id) });
        ventasCount++;
      }
    });
    
    if (ventasCount > 0) await ventaBatch.commit();
    console.log(`✅ ${ventasCount} Ventas migradas`);

    // 3. Migrar GASTOS
    const gastosSnapshot = await db.collection('GASTOS').get();
    const gastoBatch = db.batch();
    let gastosCount = 0;
    
    gastosSnapshot.docs.forEach(doc => {
      const gasto = doc.data();
      if (gasto.lote_id && lotesMap.has(gasto.lote_id)) {
        gastoBatch.update(doc.ref, { tipo_negocio: lotesMap.get(gasto.lote_id) });
        gastosCount++;
      } else {
        gastoBatch.update(doc.ref, { tipo_negocio: null });
      }
    });
    
    if (gastosSnapshot.size > 0) await gastoBatch.commit();
    console.log(`✅ ${gastosSnapshot.size} Gastos procesados`);

    // 4. Migrar REGISTRO_DIARIO_PRODUCCION
    const registrosSnapshot = await db.collection('REGISTRO_DIARIO_PRODUCCION').get();
    const registroBatch = db.batch();
    let registrosCount = 0;
    
    registrosSnapshot.docs.forEach(doc => {
      const registro = doc.data();
      if (registro.lote_id && lotesMap.has(registro.lote_id)) {
        registroBatch.update(doc.ref, { tipo_negocio: lotesMap.get(registro.lote_id) });
        registrosCount++;
      }
    });
    
    if (registrosCount > 0) await registroBatch.commit();
    console.log(`✅ ${registrosCount} Registros diarios migrados`);

    console.log('🎉 Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await app.close();
  }
}

migrateTipoNegocio();
