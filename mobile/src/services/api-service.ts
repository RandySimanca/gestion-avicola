import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDoc, 
  runTransaction, 
  writeBatch,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../config/firebaseConfig';
import { TipoNegocio } from '../context/BusinessContext';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  isNetworkError?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

class ApiService {
  private isOnline: boolean = true;
  private currentUser: any = null;
  private currentTipoNegocio: TipoNegocio | null = null;

  setTipoNegocio(tipo: TipoNegocio) {
    this.currentTipoNegocio = tipo;
  }

  constructor() {
    // Escuchar cambios en la autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Obtener rol y nombre desde la colección de usuarios
        const userDoc = await getDoc(doc(db, 'USUARIOS', user.uid));
        if (userDoc.exists()) {
          this.currentUser = { id: user.uid, ...userDoc.data() };
        }
      } else {
        this.currentUser = null;
      }
    });
  }

  // Gestión de autenticación
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Obtener datos adicionales del usuario
      const userDoc = await getDoc(doc(db, 'USUARIOS', user.uid));
      let userData = { role: 'GALPONERO', name: 'Usuario' }; // Default
      
      if (userDoc.exists()) {
        userData = userDoc.data() as any;
      }

      const authResponse: AuthResponse = {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          email: user.email || '',
          role: userData.role,
          name: userData.name
        }
      };

      await this.saveToken(authResponse.token);
      return { success: true, data: authResponse };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error de autenticación' };
    }
  }

  async register(userData: { name: string; email: string; password: string; role: string }): Promise<ApiResponse<any>> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      // Crear documento de usuario con rol
      await setDoc(doc(db, 'USUARIOS', user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        estado: 'PENDIENTE',
        createdAt: new Date().toISOString()
      });

      return { success: true, data: { id: user.uid, ...userData } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error en el registro' };
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    await this.removeToken();
  }

  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error al guardar token:', error);
    }
  }

  private async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error al eliminar token:', error);
    }
  }

  // Métodos para Lotes
  async getLotes(tipoNegocio?: TipoNegocio): Promise<ApiResponse<any[]>> {
    try {
      const tipo = tipoNegocio || this.currentTipoNegocio;

      // 1. Obtener Lotes filtrados por tipo_negocio
      let qLotes = query(collection(db, 'LOTE'));
      if (tipo) {
        qLotes = query(collection(db, 'LOTE'), where('tipo_negocio', '==', tipo));
      }
      const querySnapshot = await getDocs(qLotes);
      const lotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Obtener Fincas, Galpones, Registros, Gastos y Ventas (también filtrados)
      let qRegistros = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'));
      let qGastos = query(collection(db, 'GASTOS'));
      let qVentas = query(collection(db, 'VENTAS'));

      if (tipo) {
        qRegistros = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'), where('tipo_negocio', '==', tipo));
        qGastos = query(collection(db, 'GASTOS'), where('tipo_negocio', '==', tipo));
        qVentas = query(collection(db, 'VENTAS'), where('tipo_negocio', '==', tipo));
      }

      const [fincasRes, galponesRes, registrosSnap, gastosSnap, ventasSnap] = await Promise.all([
        this.getFincas(),
        this.getGalpones(),
        getDocs(qRegistros),
        getDocs(qGastos),
        getDocs(qVentas)
      ]);

      const fincasMap = new Map(fincasRes.data?.map((f: any) => [f.id, f.nombre]) || []);
      const galponesMap = new Map(galponesRes.data?.map((g: any) => [g.id, g.nombre]) || []);
      
      // Calcular mortalidad acumulada por lote
      const mortalidadPorLote = new Map<string, number>();
      registrosSnap.docs.forEach(doc => {
        const data = doc.data();
        const loteId = data.lote_id;
        const mortalidad = Number(data.mortalidad_dia) || 0;
        if (loteId) {
          mortalidadPorLote.set(loteId, (mortalidadPorLote.get(loteId) || 0) + mortalidad);
        }
      });

      // Calcular ROI por lote
      const gastosPorLote = new Map<string, number>();
      gastosSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.lote_id) {
          gastosPorLote.set(data.lote_id, (gastosPorLote.get(data.lote_id) || 0) + (Number(data.total) || 0));
        }
      });

      const ventasPorLote = new Map<string, number>();
      ventasSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.lote_id) {
          const monto = data.forma_pago === 'CREDITO' ? (Number(data.abono) || 0) : (Number(data.total) || 0);
          ventasPorLote.set(data.lote_id, (ventasPorLote.get(data.lote_id) || 0) + monto);
        }
      });

      // 3. Enriquecer datos
      const lotesEnriquecidos = lotes.map((lote: any) => {
        const totalInvertido = gastosPorLote.get(lote.id) || 0;
        const totalVendido = ventasPorLote.get(lote.id) || 0;
        const roi = totalInvertido > 0 ? Math.min(100, (totalVendido / totalInvertido) * 100) : 0;

        return {
          ...lote,
          finca_nombre: lote.finca_nombre || fincasMap.get(lote.finca_id) || 'N/A',
          galpon_nombre: lote.galpon_nombre || galponesMap.get(lote.galpon_id) || 'N/A',
          mortalidad_acumulada: mortalidadPorLote.get(lote.id) || 0,
          roi_porcentaje: roi,
          total_invertido: totalInvertido,
          total_vendido: totalVendido
        };
      });

      return { success: true, data: lotesEnriquecidos };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getLote(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'LOTE', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Lote no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCachedLotes(): Promise<any[]> {
    try {
      const jsonValue = await AsyncStorage.getItem('cached_lotes');
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch(e) {
      return [];
    }
  }

  async cacheMasterData(data: any): Promise<void> {
    try {
      if (data.lotes) await AsyncStorage.setItem('cached_lotes', JSON.stringify(data.lotes));
    } catch (e) {
      console.error(e);
    }
  }

  async createLote(lote: any): Promise<ApiResponse<any>> {
    try {
      const data = {
        ...lote,
        tipo_negocio: lote.tipo_negocio || this.currentTipoNegocio,
        poblacion_actual: lote.poblacion_actual ?? lote.poblacion_inicial,
        activo: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'LOTE'), data);
      return { success: true, data: { id: docRef.id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateLote(id: string, lote: any): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'LOTE', id), lote);
      return { success: true, data: { id, ...lote } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async finalizeLote(id: string): Promise<ApiResponse<any>> {
    try {
      const data = {
        activo: false,
        fecha_finalizacion: new Date().toISOString()
      };
      await updateDoc(doc(db, 'LOTE', id), data);
      return { success: true, data: { id, ...data } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteLote(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'LOTE', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Insumos
  async getInsumos(): Promise<ApiResponse<any[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, 'INSUMO'));
      const insumos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: insumos };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createInsumo(insumo: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'INSUMO'), insumo);
      return { success: true, data: { id: docRef.id, ...insumo } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteInsumo(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'INSUMO', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getInsumo(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'INSUMO', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Insumo no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateInsumo(id: string, insumo: any): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'INSUMO', id), insumo);
      return { success: true, data: { id, ...insumo } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Gastos (Con lógica de negocio)
  async getGasto(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'GASTOS', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Gasto no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateGasto(id: string, gasto: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        const gastoRef = doc(db, 'GASTOS', id);
        const gastoDoc = await transaction.get(gastoRef);
        
        if (!gastoDoc.exists()) {
          throw new Error('Gasto no encontrado');
        }

        const gastoAnterior = gastoDoc.data();

        // Si era una compra de insumo, revertir el stock anterior
        if (gastoAnterior.tipo_gasto === 'COMPRA_INSUMO' && gastoAnterior.insumo_id) {
          const insumoRef = doc(db, 'INSUMO', gastoAnterior.insumo_id);
          const insumoDoc = await transaction.get(insumoRef);
          
          if (insumoDoc.exists()) {
            const stockActual = insumoDoc.data().stock_actual || 0;
            transaction.update(insumoRef, {
              stock_actual: stockActual - Number(gastoAnterior.cantidad)
            });
          }
        }

        // Si la nueva versión es compra de insumo, aplicar el nuevo stock
        if (gasto.tipo_gasto === 'COMPRA_INSUMO' && gasto.insumo_id) {
          const insumoRef = doc(db, 'INSUMO', gasto.insumo_id);
          const insumoDoc = await transaction.get(insumoRef);
          
          if (!insumoDoc.exists()) {
            throw new Error('Insumo no encontrado');
          }

          const stockActual = insumoDoc.data().stock_actual || 0;
          // Nota: Si es el mismo insumo, el stockActual ya tiene restada la cantidad anterior (dentro de la transacción)
          // Si es diferente insumo, es el stock actual de ese otro insumo.
          
          transaction.update(insumoRef, {
            stock_actual: stockActual + Number(gasto.cantidad),
            precio_unitario: Number(gasto.precio_unitario)
          });
        }

        // Actualizar el gasto
        transaction.update(gastoRef, gasto);
      });

      return { success: true, data: { id, ...gasto } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createGasto(gasto: any): Promise<ApiResponse<any>> {
    try {
      // Crear el gasto operativo (sin lógica de compras)
      // Filtrar campos undefined antes de guardar
      const gastoData: any = {
        fecha: gasto.fecha,
        concepto: gasto.concepto,
        tipo_gasto: gasto.tipo_gasto,
        categoria: 'GASTO', // Todos los gastos operativos son GASTO
        cantidad: gasto.cantidad,
        precio_unitario: gasto.precio_unitario,
        total: gasto.total,
        metodo_pago: gasto.metodo_pago || 'EFECTIVO',
        tipo_negocio: gasto.tipo_negocio || this.currentTipoNegocio,
        fecha_creacion: new Date().toISOString()
      };
      
      // Solo incluir campos opcionales si tienen valor
      if (gasto.lote_id) gastoData.lote_id = gasto.lote_id;
      if (gasto.proveedor) gastoData.proveedor = gasto.proveedor;
      if (gasto.observaciones) gastoData.observaciones = gasto.observaciones;

      const gastoRef = doc(collection(db, 'GASTOS'));
      await setDoc(gastoRef, gastoData);

      return { success: true, data: { id: gastoRef.id, ...gastoData } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGastos(loteId?: string, tipoNegocio?: TipoNegocio): Promise<ApiResponse<any[]>> {
    try {
      const tipo = tipoNegocio || this.currentTipoNegocio;
      let constraints = [];
      
      if (loteId) {
        constraints.push(where('lote_id', '==', loteId));
      }
      
      if (tipo) {
        constraints.push(where('tipo_negocio', '==', tipo));
      }
      
      const q = constraints.length > 0 
        ? query(collection(db, 'GASTOS'), ...constraints)
        : query(collection(db, 'GASTOS'));
        
      const querySnapshot = await getDocs(q);
      const gastos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrar solo gastos operativos (excluir compras y consumos)
      const gastosOperativos = gastos.filter((gasto: any) => {
        const tipoGasto = gasto.tipo_gasto;
        return tipoGasto && 
               tipoGasto !== 'COMPRA_LOTE' && 
               tipoGasto !== 'COMPRA_INSUMO' && 
               tipoGasto !== 'CONSUMO_LOTE';
      });
      
      return { success: true, data: gastosOperativos };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Compras
  async createCompra(compra: any): Promise<ApiResponse<any>> {
    try {
      const isOnline = this.getConnectionStatus();
      
      if (isOnline) {
        // Usar transacción para asegurar consistencia
        let result: any = null;
        
        await runTransaction(db, async (transaction) => {
          if (compra.tipo_compra === 'LOTE') {
            // 1. Validar finca y galpón
            const fincaRef = doc(db, 'FINCA', compra.finca_id);
            const galponRef = doc(db, 'GALPON', compra.galpon_id);
            const [fincaDoc, galponDoc] = await Promise.all([
              transaction.get(fincaRef),
              transaction.get(galponRef)
            ]);

            if (!fincaDoc.exists()) {
              throw new Error('Finca no encontrada');
            }
            if (!galponDoc.exists()) {
              throw new Error('Galpón no encontrado');
            }

            const fincaData = fincaDoc.data();
            const galponData = galponDoc.data();

            // 2. Crear el lote
            const loteRef = doc(collection(db, 'LOTE'));
            transaction.set(loteRef, {
              nombre: compra.nombre_lote,
              tipo_ave: compra.tipo_ave,
              tipo_negocio: compra.tipo_negocio || this.currentTipoNegocio,
              poblacion_inicial: compra.poblacion_inicial,
              poblacion_actual: compra.poblacion_inicial,
              precio_compra_unitario: compra.precio_compra_unitario,
              finca_id: compra.finca_id,
              finca_nombre: fincaData.nombre,
              galpon_id: compra.galpon_id,
              galpon_nombre: galponData.nombre,
              fecha_ingreso: compra.fecha,
              activo: true,
              createdAt: new Date(),
            });

            // 3. Crear registro en GASTOS (filtrar campos undefined)
            const gastoRef = doc(collection(db, 'GASTOS'));
            const gastoData: any = {
              tipo_compra: 'LOTE',
              tipo_gasto: 'COMPRA_LOTE',
              categoria: 'INVERSION',
              fecha: compra.fecha,
              concepto: `Compra de lote: ${compra.nombre_lote}`,
              cantidad: compra.poblacion_inicial,
              precio_unitario: compra.precio_compra_unitario,
              total: compra.total,
              metodo_pago: compra.metodo_pago || 'EFECTIVO',
              lote_id: loteRef.id,
              tipo_negocio: compra.tipo_negocio || this.currentTipoNegocio,
              fecha_creacion: new Date(),
            };
            if (compra.proveedor) gastoData.proveedor = compra.proveedor;
            if (compra.observaciones) gastoData.observaciones = compra.observaciones;
            transaction.set(gastoRef, gastoData);

            result = { id: gastoRef.id, lote_id: loteRef.id, gasto_id: gastoRef.id };
          } else if (compra.tipo_compra === 'INSUMO') {
            let insumoId: string;
            let insumoNombre: string;

            if (compra.insumo_id) {
              // Insumo existente: actualizar stock
              const insumoRef = doc(db, 'INSUMO', compra.insumo_id);
              const insumoDoc = await transaction.get(insumoRef);

              if (!insumoDoc.exists()) {
                throw new Error('Insumo no encontrado');
              }

              const insumoData = insumoDoc.data();
              insumoId = compra.insumo_id;
              insumoNombre = insumoData.nombre_producto;

              // Actualizar stock y precio
              const nuevoStock = (insumoData.stock_actual || 0) + compra.cantidad;
              transaction.update(insumoRef, {
                stock_actual: nuevoStock,
                precio_unitario: compra.precio_unitario,
              });
            } else {
              // Nuevo insumo: crear en inventario (filtrar campos undefined)
              const insumoRef = doc(collection(db, 'INSUMO'));
              const insumoData: any = {
                nombre_producto: compra.nombre_insumo,
                tipo: compra.tipo_insumo,
                unidad_medida: compra.unidad_medida,
                stock_actual: compra.cantidad,
                stock_minimo: 0,
                precio_unitario: compra.precio_unitario,
                createdAt: new Date(),
              };
              if (compra.proveedor) insumoData.proveedor = compra.proveedor;
              transaction.set(insumoRef, insumoData);
              insumoId = insumoRef.id;
              insumoNombre = compra.nombre_insumo;
            }

            // Crear registro en GASTOS (filtrar campos undefined)
            const gastoRef = doc(collection(db, 'GASTOS'));
            const gastoData: any = {
              tipo_compra: 'INSUMO',
              tipo_gasto: 'COMPRA_INSUMO',
              categoria: 'INVERSION',
              fecha: compra.fecha,
              concepto: `Compra: ${insumoNombre}`,
              cantidad: compra.cantidad,
              precio_unitario: compra.precio_unitario,
              total: compra.total,
              metodo_pago: compra.metodo_pago || 'EFECTIVO',
              tipo_negocio: compra.tipo_negocio || this.currentTipoNegocio,
              insumo_id: insumoId,
              fecha_creacion: new Date(),
            };
            if (compra.proveedor) gastoData.proveedor = compra.proveedor;
            if (compra.observaciones) gastoData.observaciones = compra.observaciones;
            transaction.set(gastoRef, gastoData);

            result = { id: gastoRef.id, insumo_id: insumoId, gasto_id: gastoRef.id };
          }
        });

        return { success: true, data: result };
      } else {
        // Guardar localmente para sincronizar después
        await this.savePendingRecord('compras', compra);
        return { success: true, data: compra, isNetworkError: true };
      }
    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        // Guardar localmente si hay error de red
        await this.savePendingRecord('compras', compra);
        return { success: true, data: compra, isNetworkError: true };
      }
      return { success: false, error: error.message };
    }
  }

  async getCompras(loteId?: string): Promise<ApiResponse<any[]>> {
    try {
      let querySnapshot;
      
      if (loteId) {
        // Para un lote específico, buscar compras de ese lote
        const q = query(
          collection(db, 'GASTOS'),
          where('lote_id', '==', loteId),
          where('tipo_gasto', '==', 'COMPRA_LOTE'),
          orderBy('fecha', 'desc')
        );
        querySnapshot = await getDocs(q);
      } else {
        // Para todas las compras, obtener todos los gastos y filtrar
        // (evita problemas con índices compuestos en Firestore)
        const q = query(
          collection(db, 'GASTOS'),
          orderBy('fecha', 'desc')
        );
        querySnapshot = await getDocs(q);
      }
      
      // Filtrar solo compras (lotes e insumos)
      const compras = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item: any) => {
          const tipoGasto = item.tipo_gasto;
          return tipoGasto === 'COMPRA_LOTE' || tipoGasto === 'COMPRA_INSUMO';
        });
      
      return { success: true, data: compras };
    } catch (error: any) {
      console.error('Error en getCompras:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteCompra(id: string): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        const gastoRef = doc(db, 'GASTOS', id);
        const gastoDoc = await transaction.get(gastoRef);

        if (!gastoDoc.exists()) {
          throw new Error('Registro de compra no encontrado');
        }

        const data = gastoDoc.data();

        if (data.tipo_gasto === 'COMPRA_LOTE' && data.lote_id) {
          // 1. Eliminar el lote asociado
          const loteRef = doc(db, 'LOTE', data.lote_id);
          transaction.delete(loteRef);
        } else if (data.tipo_gasto === 'COMPRA_INSUMO' && data.insumo_id) {
          // 2. Revertir stock del insumo
          const insumoRef = doc(db, 'INSUMO', data.insumo_id);
          const insumoDoc = await transaction.get(insumoRef);
          if (insumoDoc.exists()) {
            const stockActual = insumoDoc.data().stock_actual || 0;
            transaction.update(insumoRef, {
              stock_actual: stockActual - Number(data.cantidad)
            });
          }
        }

        // 3. Eliminar el registro de gasto
        transaction.delete(gastoRef);
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCompra(id: string, compra: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        const gastoRef = doc(db, 'GASTOS', id);
        const gastoDoc = await transaction.get(gastoRef);

        if (!gastoDoc.exists()) {
          throw new Error('Registro de compra no encontrado');
        }

        const dataAnterior = gastoDoc.data();

        if (dataAnterior.tipo_gasto === 'COMPRA_LOTE' && dataAnterior.lote_id) {
          // 1. Actualizar el lote asociado
          const loteRef = doc(db, 'LOTE', dataAnterior.lote_id);
          transaction.update(loteRef, {
            nombre: compra.nombre_lote,
            tipo_ave: compra.tipo_ave,
            poblacion_inicial: compra.poblacion_inicial,
            poblacion_actual: compra.poblacion_inicial, // Se asume que si se edita la compra, se resetea la población
            precio_compra_unitario: compra.precio_compra_unitario,
            fecha_ingreso: compra.fecha,
          });
        } else if (dataAnterior.tipo_gasto === 'COMPRA_INSUMO' && dataAnterior.insumo_id) {
          // 2. Ajustar stock del insumo
          const insumoRef = doc(db, 'INSUMO', dataAnterior.insumo_id);
          const insumoDoc = await transaction.get(insumoRef);
          
          if (insumoDoc.exists()) {
            const stockActual = insumoDoc.data().stock_actual || 0;
            // Revertir anterior y aplicar nuevo
            const nuevoStock = stockActual - Number(dataAnterior.cantidad) + Number(compra.cantidad);
            transaction.update(insumoRef, {
              stock_actual: nuevoStock,
              precio_unitario: compra.precio_unitario
            });
          }
        }

        // 3. Actualizar el registro de gasto
        const gastoData: any = {
          fecha: compra.fecha,
          concepto: compra.tipo_compra === 'LOTE' 
            ? `Compra de lote: ${compra.nombre_lote}` 
            : `Compra: ${compra.nombre_insumo || dataAnterior.concepto.replace('Compra: ', '')}`,
          cantidad: compra.tipo_compra === 'LOTE' ? compra.poblacion_inicial : compra.cantidad,
          precio_unitario: compra.tipo_compra === 'LOTE' ? compra.precio_compra_unitario : compra.precio_unitario,
          total: compra.total,
          metodo_pago: compra.metodo_pago,
          proveedor: compra.proveedor || null,
          observaciones: compra.observaciones || null,
        };

        transaction.update(gastoRef, gastoData);
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteGasto(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'GASTOS', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Ventas (Con lógica de negocio)
  async createVenta(venta: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Verificar lote y población
        const loteRef = doc(db, 'LOTE', venta.lote_id);
        const loteDoc = await transaction.get(loteRef);

        if (!loteDoc.exists()) {
          throw new Error('Lote no encontrado');
        }

        const loteData = loteDoc.data();
        const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
        const esVentaAves = venta.tipo_producto === 'AVES';

        if (esVentaAves && venta.cantidad > poblacionActual) {
          throw new Error(`No hay suficientes aves. Disponibles: ${poblacionActual}`);
        }

        // 2. Crear venta
        const ventaRef = doc(collection(db, 'VENTAS'));
        transaction.set(ventaRef, {
          ...venta,
          tipo_negocio: venta.tipo_negocio || this.currentTipoNegocio,
          abono: venta.abono || 0,
          fecha_creacion: new Date().toISOString()
        });

        // 3. Actualizar población solo si es venta de aves
        if (esVentaAves) {
          const nuevaPoblacion = poblacionActual - venta.cantidad;
          const updateData: any = { poblacion_actual: nuevaPoblacion };

          // 4. Finalizar si llega a 0
          if (nuevaPoblacion === 0) {
            updateData.activo = false;
            updateData.fecha_finalizacion = new Date().toISOString();
          }

          transaction.update(loteRef, updateData);
        }
      });

      return { success: true, data: venta };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getVentas(tipoNegocio?: TipoNegocio): Promise<ApiResponse<any[]>> {
    try {
      const tipo = tipoNegocio || this.currentTipoNegocio;
      let q = query(collection(db, 'VENTAS'), orderBy('fecha', 'desc'));
      
      if (tipo) {
        q = query(
          collection(db, 'VENTAS'), 
          where('tipo_negocio', '==', tipo),
          orderBy('fecha', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: ventas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateVenta(id: string, nuevosDatos: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        const ventaRef = doc(db, 'VENTAS', id);
        const ventaSnap = await transaction.get(ventaRef);
        if (!ventaSnap.exists()) throw new Error('Venta no encontrada');
        
        const ventaAnterior = ventaSnap.data();
        const loteId = nuevosDatos.lote_id || ventaAnterior.lote_id;
        const loteRef = doc(db, 'LOTE', loteId);
        const loteSnap = await transaction.get(loteRef);
        if (!loteSnap.exists()) throw new Error('Lote no encontrado');
        
        const loteData = loteSnap.data();
        let poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
        
        // Revertir cantidad anterior
        poblacionActual += (ventaAnterior.cantidad || 0);
        
        const nuevaCantidad = nuevosDatos.cantidad ?? ventaAnterior.cantidad;
        if (nuevaCantidad > poblacionActual) {
          throw new Error(`No hay suficientes aves. Disponibles: ${poblacionActual}`);
        }
        
        const nuevaPoblacionFinal = poblacionActual - nuevaCantidad;
        const updateLoteData: any = { poblacion_actual: nuevaPoblacionFinal };
        
        if (nuevaPoblacionFinal === 0) {
          updateLoteData.activo = false;
          updateLoteData.fecha_finalizacion = new Date().toISOString();
        } else if (nuevaPoblacionFinal > 0 && !loteData.activo) {
          updateLoteData.activo = true;
          updateLoteData.fecha_finalizacion = null;
        }
        
        transaction.update(loteRef, updateLoteData);
        transaction.update(ventaRef, {
          ...nuevosDatos,
          fecha_modificacion: new Date().toISOString(),
          modificado_por: this.currentUser?.id || 'unknown'
        });
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Consumo (Con lógica de negocio)
  async createConsumoInsumo(consumo: any): Promise<ApiResponse<any>> {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Verificar Insumo y Stock
        const insumoRef = doc(db, 'INSUMO', consumo.insumo_id);
        const insumoDoc = await transaction.get(insumoRef);

        if (!insumoDoc.exists()) {
          throw new Error('Insumo no encontrado');
        }

        const insumoData = insumoDoc.data();
        if (insumoData.stock_actual < consumo.cantidad) {
          throw new Error(`Stock insuficiente. Disponible: ${insumoData.stock_actual}`);
        }

        // 2. Crear registro de consumo
        const consumoRef = doc(collection(db, 'CONSUMO_INSUMO'));
        transaction.set(consumoRef, {
          ...consumo,
          fecha_creacion: new Date().toISOString()
        });

        // 3. Descontar stock
        transaction.update(insumoRef, {
          stock_actual: insumoData.stock_actual - consumo.cantidad
        });

        // 4. Generar Gasto Automático
        const gastoRef = doc(collection(db, 'GASTOS'));
        const costoTotal = consumo.cantidad * (insumoData.precio_unitario || 0);
        
        transaction.set(gastoRef, {
          fecha: consumo.fecha,
          concepto: `Consumo: ${insumoData.nombre_producto}`,
          categoria: 'ALIMENTACION', // O sanitarios, según tipo
          total: costoTotal,
          lote_id: consumo.lote_id,
          tipo_gasto: 'CONSUMO_LOTE',
          insumo_id: consumo.insumo_id,
          cantidad: consumo.cantidad,
          precio_unitario: insumoData.precio_unitario,
          fecha_creacion: new Date().toISOString()
        });
      });

      return { success: true, data: consumo };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Agrega este método en la clase ApiService, después de los métodos de Consumo

// Métodos para Registros Diarios de Producción
async createRegistroDiario(datos: {
  lote_id: string;
  fecha: string;
  mortalidad_dia: number;
  alimento_consumido_kg: number;
  huevos_totales: number;
  desglose_huevos?: {
    jumbo?: number;
    aaa?: number;
    aa?: number;
    a?: number;
    b?: number;
    c?: number;
    sucios_rotos?: number;
  };
  observaciones: string | null;
}): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Verificar que el lote existe
      const loteRef = doc(db, 'LOTE', datos.lote_id);
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists()) {
        throw new Error('Lote no encontrado');
      }

      const loteData = loteDoc.data();
      const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;

      // 2. Validar que hay suficientes aves
      if (datos.mortalidad_dia > poblacionActual) {
        throw new Error(`Mortalidad mayor a población actual. Disponibles: ${poblacionActual}`);
      }

      // 3. Crear registro diario
      const registroRef = doc(collection(db, 'REGISTRO_DIARIO_PRODUCCION'));
      transaction.set(registroRef, {
        ...datos,
        tipo_negocio: (datos as any).tipo_negocio || this.currentTipoNegocio,
        ownerId: this.currentUser?.id || null,
        fecha_creacion: new Date().toISOString()
      });

      // 4. Actualizar población del lote si hay mortalidad
      if (datos.mortalidad_dia > 0) {
        const nuevaPoblacion = poblacionActual - datos.mortalidad_dia;
        const updateData: any = { poblacion_actual: nuevaPoblacion };

        // Si la población llega a 0, finalizar el lote
        if (nuevaPoblacion === 0) {
          updateData.activo = false;
          updateData.fecha_finalizacion = new Date().toISOString();
        }

        transaction.update(loteRef, updateData);
      }
    });

    return { success: true, data: datos };
  } catch (error: any) {
    console.error('Error en createRegistroDiario:', error);
    return { 
      success: false, 
      error: error.message || 'Error al crear registro',
      isNetworkError: error.code === 'unavailable' || error.message.includes('network')
    };
  }
}

async getRegistrosDiarios(loteId?: string): Promise<ApiResponse<any[]>> {
  try {
    let q;
    if (loteId) {
      q = query(
        collection(db, 'REGISTRO_DIARIO_PRODUCCION'), 
        where('lote_id', '==', loteId),
        orderBy('fecha', 'desc')
      );
    } else {
      q = query(
        collection(db, 'REGISTRO_DIARIO_PRODUCCION'),
        orderBy('fecha', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const registros = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: registros };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async updateRegistroDiario(id: string, nuevosDatos: any): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener registro anterior
      const registroRef = doc(db, 'REGISTRO_DIARIO_PRODUCCION', id);
      const registroSnap = await transaction.get(registroRef);
      
      if (!registroSnap.exists()) {
        throw new Error('Registro no encontrado');
      }
      
      const registroAnterior = registroSnap.data();
      const loteId = nuevosDatos.lote_id || registroAnterior.lote_id;
      
      // 2. Obtener lote
      const loteRef = doc(db, 'LOTE', loteId);
      const loteSnap = await transaction.get(loteRef);
      
      if (!loteSnap.exists()) {
        throw new Error('Lote no encontrado');
      }
      
      const loteData = loteSnap.data();
      let poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
      
      // 3. Revertir mortalidad anterior
      poblacionActual += (registroAnterior.mortalidad_dia || 0);
      
      // 4. Validar nueva mortalidad
      const nuevaMortalidad = nuevosDatos.mortalidad_dia ?? registroAnterior.mortalidad_dia;
      if (nuevaMortalidad > poblacionActual) {
        throw new Error(`La nueva mortalidad excede la población. Disponibles: ${poblacionActual}`);
      }
      
      // 5. Aplicar nueva mortalidad
      const nuevaPoblacionFinal = poblacionActual - nuevaMortalidad;
      
      // 6. Actualizar lote
      const updateLoteData: any = { poblacion_actual: nuevaPoblacionFinal };
      if (nuevaPoblacionFinal === 0) {
        updateLoteData.activo = false;
        updateLoteData.fecha_finalizacion = new Date().toISOString();
      } else if (nuevaPoblacionFinal > 0 && !loteData.activo) {
        updateLoteData.activo = true;
        updateLoteData.fecha_finalizacion = null;
      }
      
      transaction.update(loteRef, updateLoteData);
      
      // 7. Actualizar registro
      transaction.update(registroRef, {
        ...nuevosDatos,
        fecha_modificacion: new Date().toISOString(),
        modificado_por: this.currentUser?.id || 'unknown'
      });
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en updateRegistroDiario:', error);
    return { success: false, error: error.message };
  }
}

async deleteRegistroDiario(id: string): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener registro
      const registroRef = doc(db, 'REGISTRO_DIARIO_PRODUCCION', id);
      const registroSnap = await transaction.get(registroRef);
      
      if (!registroSnap.exists()) {
        throw new Error('Registro no encontrado');
      }
      
      const registroData = registroSnap.data();
      
      // 2. Obtener lote
      const loteRef = doc(db, 'LOTE', registroData.lote_id);
      const loteSnap = await transaction.get(loteRef);
      
      if (loteSnap.exists()) {
        const loteData = loteSnap.data();
        const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;
        
        // 3. Restaurar población
        const nuevaPoblacion = poblacionActual + (registroData.mortalidad_dia || 0);
        const updateLoteData: any = { poblacion_actual: nuevaPoblacion };
        
        if (nuevaPoblacion > 0 && !loteData.activo) {
          updateLoteData.activo = true;
          updateLoteData.fecha_finalizacion = null;
        }
        
        transaction.update(loteRef, updateLoteData);
      }
      
      // 4. Eliminar registro
      transaction.delete(registroRef);
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error en deleteRegistroDiario:', error);
    return { success: false, error: error.message };
  }
}

  // Métodos para Fincas
  async getFincas(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'FINCA'));
      const querySnapshot = await getDocs(q);
      const fincas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: fincas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createFinca(finca: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'FINCA'), finca);
      return { success: true, data: { id: docRef.id, ...finca } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteFinca(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'FINCA', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Galpones
  async getGalpones(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'GALPON'));
      const querySnapshot = await getDocs(q);
      const galpones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: galpones };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGalponesPorFinca(fincaId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'GALPON'), where('finca_id', '==', fincaId));
      const querySnapshot = await getDocs(q);
      const galpones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: galpones };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGalpon(id: string): Promise<ApiResponse<any>> {
    try {
      const docRef = doc(db, 'GALPON', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Galpón no encontrado' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateGalpon(id: string, galpon: any): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'GALPON', id), galpon);
      return { success: true, data: { id, ...galpon } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createGalpon(galpon: any): Promise<ApiResponse<any>> {
    try {
      const docRef = await addDoc(collection(db, 'GALPON'), galpon);
      return { success: true, data: { id: docRef.id, ...galpon } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteGalpon(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'GALPON', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos para Usuarios
  async getAllUsers(): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'USUARIOS'));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async approveUser(id: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { estado: 'ACTIVO' });
      return { success: true, data: { id, estado: 'ACTIVO' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async rejectUser(id: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { estado: 'RECHAZADO' });
      return { success: true, data: { id, estado: 'RECHAZADO' } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async toggleUserStatus(id: string): Promise<ApiResponse<any>> {
    try {
        const userRef = doc(db, 'USUARIOS', id);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentStatus = userDoc.data().estado;
            const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            await updateDoc(userRef, { estado: newStatus });
            return { success: true, data: { id, estado: newStatus } };
        }
        return { success: false, error: 'Usuario no encontrado' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<any>> {
    try {
      await updateDoc(doc(db, 'USUARIOS', id), { role });
      return { success: true, data: { id, role } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    try {
      await deleteDoc(doc(db, 'USUARIOS', id));
      return { success: true, data: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Reportes y KPIs (Cálculo en cliente)
  async getRegistrosDiariosPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'), where('lote_id', '==', loteId));
      const querySnapshot = await getDocs(q);
      const registros = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: registros };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getVentasPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    try {
      const q = query(collection(db, 'VENTAS'), where('lote_id', '==', loteId));
      const querySnapshot = await getDocs(q);
      const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, data: ventas };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getResumenGlobal(tipoNegocio?: TipoNegocio): Promise<ApiResponse<any>> {
    try {
      const tipo = tipoNegocio || this.currentTipoNegocio;

      // 1. Obtener todas las ventas (Ingresos)
      let qVentas = query(collection(db, 'VENTAS'));
      if (tipo) {
        qVentas = query(collection(db, 'VENTAS'), where('tipo_negocio', '==', tipo));
      }
      const ventasSnap = await getDocs(qVentas);
      
      let totalIngresosContado = 0;
      let cuentasPorCobrar = 0;

      ventasSnap.docs.forEach(doc => {
        const data = doc.data();
        const total = data.total || 0;
        const abono = data.abono || 0;

        if (data.forma_pago === 'CREDITO') {
          totalIngresosContado += abono;
          cuentasPorCobrar += (total - abono);
        } else {
          totalIngresosContado += total;
        }
      });

      // 2. Obtener todos los gastos (Egresos) y clasificarlos
      let qGastos = query(collection(db, 'GASTOS'));
      if (tipo) {
        qGastos = query(collection(db, 'GASTOS'), where('tipo_negocio', '==', tipo));
      }
      const gastosSnap = await getDocs(qGastos);
      
      let gastosOperativos = 0;      // Nómina, servicios, aseo, arriendo
      let inversionLotes = 0;        // Compras de lotes
      let inversionInsumos = 0;      // Compras de insumos que van a bodega
      let consumosRegistrados = 0;   // Solo para referencia (NO suma a egresos de caja)

      gastosSnap.docs.forEach(doc => {
        const data = doc.data();
        const total = data.total || 0;
        const tipoGasto = data.tipo_gasto;
        
        if (tipoGasto === 'COMPRA_LOTE') {
          inversionLotes += total;
        } else if (tipoGasto === 'COMPRA_INSUMO') {
          inversionInsumos += total;
        } else if (tipoGasto === 'CONSUMO_LOTE') {
          consumosRegistrados += total;  // NO se suma a egresos de caja
        } else if (tipoGasto === 'GASTO_OPERATIVO' || 
                   ['NOMINA', 'SERVICIOS_PUBLICOS', 'ARRIENDO', 'MANTENIMIENTO', 'ASEO', 'OTRO'].includes(tipoGasto)) {
          gastosOperativos += total;
        } else if (!tipoGasto) {
          // Por defecto, si no tiene tipo, lo tratamos como operativo para no perder datos antiguos
          gastosOperativos += total;
        }
      });

      const totalEgresosCaja = gastosOperativos + inversionLotes + inversionInsumos;

      // 3. Obtener inventario actual (Activos)
      // Nota: INSUMO no tiene tipo_negocio por ahora, se trae todo o se debería filtrar si se implementa
      const insumosSnap = await getDocs(collection(db, 'INSUMO'));
      const valorInventario = insumosSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + ((data.stock_actual || 0) * (data.precio_unitario || 0));
      }, 0);

      // 4. Obtener datos operativos y registros diarios para mortalidad
      let qLotes = query(collection(db, 'LOTE'));
      if (tipo) {
        qLotes = query(collection(db, 'LOTE'), where('tipo_negocio', '==', tipo));
      }
      const lotesSnap = await getDocs(qLotes);
      const totalLotes = lotesSnap.size;
      const totalAves = lotesSnap.docs.reduce((sum, doc) => sum + (doc.data().poblacion_inicial || 0), 0);

      let qRegistros = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'));
      if (tipo) {
        qRegistros = query(collection(db, 'REGISTRO_DIARIO_PRODUCCION'), where('tipo_negocio', '==', tipo));
      }
      const registrosSnap = await getDocs(qRegistros);
      
      // 5. Agrupar datos por lote para el reporte detallado
      const detallesLotes: any = {};

      lotesSnap.docs.forEach(doc => {
        const data = doc.data();
        detallesLotes[doc.id] = {
          id: doc.id,
          nombre: data.nombre,
          finca: data.finca_nombre || 'N/A',
          ventas_totales: 0,
          abonos_recibidos: 0,
          cuentas_por_cobrar: 0,
          mortalidad_total: 0,
          poblacion_inicial: data.poblacion_inicial || 0,
          poblacion_actual: data.poblacion_actual ?? data.poblacion_inicial,
          precio_compra_unitario: data.precio_compra_unitario || 0
        };
      });

      // Sumar ventas por lote
      ventasSnap.docs.forEach(doc => {
        const data = doc.data();
        const loteId = data.lote_id;
        if (detallesLotes[loteId]) {
          const total = data.total || 0;
          const abono = data.abono || 0;
          detallesLotes[loteId].ventas_totales += total;
          detallesLotes[loteId].abonos_recibidos += abono;
          if (data.forma_pago === 'CREDITO') {
            detallesLotes[loteId].cuentas_por_cobrar += (total - abono);
          }
        }
      });

      // Sumar mortalidad por lote
      registrosSnap.docs.forEach(doc => {
        const data = doc.data();
        const loteId = data.lote_id;
        if (detallesLotes[loteId]) {
          detallesLotes[loteId].mortalidad_total += (data.mortalidad_dia || 0);
        }
      });

      // Calcular pérdidas por mortalidad (valor de las aves muertas)
      // IMPORTANTE: Esto es una pérdida de INVENTARIO, no un egreso de caja
      // El dinero ya salió cuando se compraron las aves, no cuando murieron
      let perdidaMortalidad = 0;
      Object.values(detallesLotes).forEach((lote: any) => {
        const perdidaLote = lote.mortalidad_total * lote.precio_compra_unitario;
        perdidaMortalidad += perdidaLote;
      });

      // Cálculos Financieros
      // La pérdida por mortalidad NO se suma a egresos de caja (el dinero ya salió al comprar)
      const cajaActual = totalIngresosContado - totalEgresosCaja;
      const patrimonioNeto = cajaActual + valorInventario + cuentasPorCobrar;
      
      // La utilidad operativa SÍ considera la pérdida porque afecta la rentabilidad del negocio
      const utilidadOperativa = (totalIngresosContado + cuentasPorCobrar) - gastosOperativos - consumosRegistrados - perdidaMortalidad;
      const margenOperativo = (totalIngresosContado + cuentasPorCobrar) > 0 ? (utilidadOperativa / (totalIngresosContado + cuentasPorCobrar)) * 100 : 0;

      return {
        success: true,
        data: {
          // Estado de Caja (Dinero Real)
          flujo_caja: {
            total_ingresos_contado: totalIngresosContado,
            cuentas_por_cobrar: cuentasPorCobrar,
            gastos_operativos: gastosOperativos,
            inversion_lotes: inversionLotes,
            inversion_insumos: inversionInsumos,
            perdida_mortalidad: perdidaMortalidad,
            total_egresos_caja: totalEgresosCaja,
            caja_actual: cajaActual,
          },
          // Balance General (Activos)
          balance: {
            efectivo: cajaActual,
            inventario: valorInventario,
            cuentas_por_cobrar: cuentasPorCobrar,
            activo_total: patrimonioNeto,
          },
          // Resultado Operativo
          resultado: {
            utilidad_operativa: utilidadOperativa,
            margen_operativo: margenOperativo,
            costo_consumos: consumosRegistrados,
          },
          // Operación
          resumen: {
            total_lotes: totalLotes,
            total_aves_inicial: totalAves
          },
          // Detalles por lote para PDF
          detalles_lotes: Object.values(detallesLotes)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getGlobalKPIs(tipoNegocio?: TipoNegocio): Promise<ApiResponse<any>> {
    try {
      const tipo = tipoNegocio || this.currentTipoNegocio;

      // 1. OBTENER LOTES ACTIVOS FILTRADOS POR TIPO DE NEGOCIO
      let qLotes = query(collection(db, 'LOTE'), where('activo', '==', true));
      if (tipo) {
        qLotes = query(
          collection(db, 'LOTE'), 
          where('activo', '==', true), 
          where('tipo_negocio', '==', tipo)
        );
      }
      const lotesSnapshot = await getDocs(qLotes);
      const lotes = lotesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Crear un Set con los IDs de lotes activos del tipo de negocio seleccionado
      const lotesActivosIds = new Set(lotes.map(l => l.id));

      // 2. OBTENER REGISTROS DIARIOS (Limitado a los últimos 90 días para rendimiento)
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);
      const noventaDiasAtrasIso = noventaDiasAtras.toISOString();

      const qRegistros = query(
        collection(db, 'REGISTRO_DIARIO_PRODUCCION'),
        where('fecha', '>=', noventaDiasAtrasIso)
      );
      const registrosSnapshot = await getDocs(qRegistros);
      const todosLosRegistros = registrosSnapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));

      // Filtrar registros por tipo de negocio (independiente de si el lote está activo ahora)
      const registrosDelNegocio = todosLosRegistros.filter((r: any) => {
        return !tipo || !r.tipo_negocio || r.tipo_negocio === tipo;
      });

      // 3. CALCULAR FECHAS
      const ahora = new Date();
      const inicioHoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioHoyIso = inicioHoyLocal.toISOString();

      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      const sieteDiasAtrasIso = sieteDiasAtras.toISOString().split('T')[0];

      // 4. CALCULAR MORTALIDAD SEMANAL (ÚLTIMOS 7 DÍAS - Todos los lotes del negocio)
      const mortalidadSemanal = registrosDelNegocio
        .filter((r: any) => {
          if (!r.fecha || r.fecha < sieteDiasAtrasIso) return false;
          return (r.mortalidad_dia || 0) > 0;
        })
        .reduce((sum: number, r: any) => sum + (Number(r.mortalidad_dia) || 0), 0);

      // 5. CALCULAR PRODUCCIÓN HOY (Todos los lotes del negocio)
      const produccionHoy = registrosDelNegocio
        .filter((r: any) => r.fecha && r.fecha >= inicioHoyIso)
        .reduce((sum: number, r: any) => sum + (Number(r.huevos_totales) || 0), 0);

      // 6. VENTAS HOY (Robustez: Obtener todas las del día y filtrar en memoria)
      const qVentas = query(collection(db, 'VENTAS'), where('fecha', '>=', inicioHoyIso));
      const ventasSnapshot = await getDocs(qVentas);
      
      const ventasHoy = ventasSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .filter((v: any) => {
          if (!v.fecha || v.fecha < inicioHoyIso) return false;
          if (tipo && v.tipo_negocio && v.tipo_negocio !== tipo) return false;
          return true;
        })
        .reduce((sum: number, v: any) => {
          if (v.forma_pago === 'CREDITO') {
            return sum + (Number(v.abono) || 0);
          }
          return sum + (Number(v.total) || 0);
        }, 0);

      // 7. GASTOS HOY (Robustez: Obtener todos los del día y filtrar en memoria)
      const qGastos = query(collection(db, 'GASTOS'), where('fecha', '>=', inicioHoyIso));
      const gastosSnapshot = await getDocs(qGastos);
      const gastosHoyRaw = gastosSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      
      let gastosOperativosHoy = 0;
      let inversionesHoy = 0;
      
      gastosHoyRaw
        .filter((g: any) => {
          if (!g.fecha || g.fecha < inicioHoyIso) return false;
          if (tipo && g.tipo_negocio && g.tipo_negocio !== tipo) return false;
          return true;
        })
        .forEach((g: any) => {
          if (g.tipo_gasto === 'COMPRA_LOTE') {
            if (g.tipo_negocio === 'PONEDORAS') {
              inversionesHoy += (Number(g.total) || 0);
            } else {
              gastosOperativosHoy += (Number(g.total) || 0);
            }
          } else {
            gastosOperativosHoy += (Number(g.total) || 0);
          }
        });

      // 8. POBLACIÓN TOTAL (Solo lotes activos)
      const totalAves = lotes.reduce(
        (sum: number, l: any) => sum + (Number(l.poblacion_actual) || 0), 
        0
      );

      // 9. MORTALIDAD TOTAL ACTIVOS (Solo registros de lotes que están activos AHORA)
      const mortalidadTotalActivos = registrosDelNegocio
        .filter((r: any) => lotesActivosIds.has(r.lote_id))
        .reduce((sum: number, r: any) => {
          return sum + (Number(r.mortalidad_dia) || 0);
        }, 0);

      const pagosEfectivoHoy = ventasHoy; // En esta implementación, ventasHoy ya es el efectivo recibido

      return {
        success: true,
        data: {
          totalAves,
          lotesActivos: lotes.length,
          produccionHoy,
          mortalidadSemanal,
          ventasHoy,
          gastosOperativosHoy,
          inversionesHoy,
          mortalidadTotalActivos,
          pagosEfectivoHoy
        }
      };
    } catch (error: any) {
      console.error('Error en getGlobalKPIs:', error);
      return { success: false, error: error.message };
    }
  }

  async getLoteProfitability(loteId: string): Promise<ApiResponse<any>> {
    try {
      const loteRef = doc(db, 'LOTE', loteId);
      const loteSnap = await getDoc(loteRef);
      if (!loteSnap.exists()) throw new Error('Lote no encontrado');
      const lote = loteSnap.data();

      const gastosSnapshot = await getDocs(query(collection(db, 'GASTOS'), where('lote_id', '==', loteId)));
      const gastos = gastosSnapshot.docs.map(d => d.data());
      
      const ventasSnapshot = await getDocs(query(collection(db, 'VENTAS'), where('lote_id', '==', loteId)));
      const ventas = ventasSnapshot.docs.map(d => d.data());

      const inversionInicial = gastos
        .filter(g => g.tipo_gasto === 'COMPRA_LOTE')
        .reduce((sum, g) => sum + (Number(g.total) || 0), 0);
        
      const gastosOperativos = gastos
        .filter(g => g.tipo_gasto !== 'COMPRA_LOTE')
        .reduce((sum, g) => sum + (Number(g.total) || 0), 0);

      const ingresosAcumulados = ventas.reduce((sum, v) => {
        if (v.forma_pago === 'CREDITO') {
          return sum + (Number(v.abono) || 0);
        }
        return sum + (Number(v.total) || 0);
      }, 0);

      const totalInvertido = inversionInicial + gastosOperativos;
      const porcentajeRecuperado = totalInvertido > 0 
        ? Math.min(100, (ingresosAcumulados / totalInvertido) * 100) 
        : 0;

      return {
        success: true,
        data: {
          loteId,
          nombre: lote.nombre,
          tipoAve: lote.tipo_ave,
          inversionInicial,
          gastosOperativos,
          totalInvertido,
          ingresosAcumulados,
          porcentajeRecuperado,
          saldo: ingresosAcumulados - totalInvertido
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Métodos auxiliares para mantener compatibilidad
  // Métodos auxiliares para mantener compatibilidad
async getPendingRecords(type?: string): Promise<any[]> { 
  try {
    if (!type) {
        const types = ['produccion', 'ventas', 'gastos', 'mortalidad', 'compras'];
        let allPending: any[] = [];
        for (const t of types) {
            const p = await this.getPendingRecords(t);
            allPending = [...allPending, ...p];
        }
        return allPending;
    }
    const jsonValue = await AsyncStorage.getItem(`pending_${type}`);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch(e) {
    return [];
  }
}

  async savePendingRecord(type: string, data: any) {
    try {
      const current = await this.getPendingRecords(type);
      current.push(data);
      await AsyncStorage.setItem(`pending_${type}`, JSON.stringify(current));
    } catch (e) {
      console.error('Error saving pending record', e);
    }
  }

  async syncPendingData(): Promise<{success: boolean; error?: string}> { return { success: true }; }
  
  getConnectionStatus() {
    return this.isOnline;
  }

  async checkConnection() { 
    // TODO: Implement real connection check with NetInfo if needed
    this.isOnline = true; 
    return this.isOnline;
  }

  async getCurrentUser() {
  return this.currentUser;
}

async deleteVenta(id: string): Promise<ApiResponse<any>> {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Obtener los datos de la venta antes de eliminarla
      const ventaRef = doc(db, 'VENTAS', id);
      const ventaDoc = await transaction.get(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const ventaData = ventaDoc.data();
      const loteId = ventaData.lote_id;
      const cantidadVendida = ventaData.cantidad;

      // 2. Obtener el lote para restaurar la población
      const loteRef = doc(db, 'LOTE', loteId);
      const loteDoc = await transaction.get(loteRef);

      if (!loteDoc.exists()) {
        throw new Error('Lote no encontrado');
      }

      const loteData = loteDoc.data();
      const poblacionActual = loteData.poblacion_actual ?? loteData.poblacion_inicial;

      // 3. Restaurar la población del lote
      const nuevaPoblacion = poblacionActual + cantidadVendida;
      const updateData: any = { poblacion_actual: nuevaPoblacion };

      // 4. Si el lote estaba inactivo y la población vuelve a ser mayor que 0, reactivarlo
      if (!loteData.activo && nuevaPoblacion > 0) {
        updateData.activo = true;
        updateData.fecha_finalizacion = null; // Limpiar la fecha de finalización
      }

      transaction.update(loteRef, updateData);

      // 5. Eliminar la venta
      transaction.delete(ventaRef);
    });

    return { success: true, data: { id } };
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    return { success: false, error: error.message };
  }
}

}

export default new ApiService();
