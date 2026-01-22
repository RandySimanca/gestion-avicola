import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import { useBusiness } from '../context/BusinessContext';
import { generateVentaPDF } from '../utils/pdfGenerator';

interface Venta {
  id: string;
  lote_id: string;
  tipo_producto: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  cliente: string;
  fecha: string;
  forma_pago: string;
  abono?: number;
  abonos?: Array<{ monto: number; fecha: string }>;
  observaciones?: string;
  isPending?: boolean;
}

export default function VentasScreen({ navigation }: any) {
  const { tipoNegocio } = useBusiness();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarVentas();
  }, [tipoNegocio]);

  const cargarVentas = async () => {
    try {
      const response = await apiService.getVentas(tipoNegocio);
      if (response.success && response.data) {
        // El API ya devuelve las ventas ordenadas de forma robusta
        setVentas(response.data);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarVentas();
  };

  const handleEditar = (venta: Venta) => {
    navigation.navigate('EditarVenta', { venta });
  };

  const handleEliminar = (venta: Venta) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar esta venta?\n\nCliente: ${venta.cliente}\nTotal: $${formatNumber(venta.total)}\n\nEsto restaurará la población del lote.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.deleteVenta(venta.id);

              if (response.success) {
                Alert.alert('Éxito', 'Venta eliminada correctamente');
                await cargarVentas();
              } else {
                Alert.alert('Error', response.error || 'No se pudo eliminar la venta');
              }
            } catch (error) {
              console.error('Error eliminando venta:', error);
              Alert.alert('Error', 'Error al eliminar la venta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-CO').format(num || 0);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getFormaPagoColor = (formaPago: string) => {
    switch (formaPago) {
      case 'CONTADO_EFECTIVO':
        return '#27ae60';
      case 'CONTADO_TRANSFERENCIA':
        return '#3498db';
      case 'CREDITO':
        return '#e67e22';
      default:
        return '#95a5a6';
    }
  };

  const getFormaPagoLabel = (formaPago: string) => {
    switch (formaPago) {
      case 'CONTADO_EFECTIVO':
        return 'Efectivo';
      case 'CONTADO_TRANSFERENCIA':
        return 'Transferencia';
      case 'CREDITO':
        return 'Crédito';
      default:
        return formaPago;
    }
  };

  const handleInvoice = async (venta: Venta) => {
    try {
      await generateVentaPDF(venta);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la factura');
    }
  };

  const renderVenta = ({ item }: { item: Venta }) => {
    const saldoPendiente = item.forma_pago === 'CREDITO'
      ? item.total - (item.abono || 0)
      : 0;

    return (
      <View style={styles.ventaCard}>
        <View style={styles.ventaHeader}>
          <View style={styles.ventaHeaderLeft}>
            <Text style={styles.clienteText}>{item.cliente}</Text>
            <Text style={styles.fechaText}>{formatDate(item.fecha)}</Text>
          </View>
          <View style={styles.ventaHeaderRight}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleInvoice(item)}
            >
              <Ionicons name="document-text-outline" size={20} color="#27ae60" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, item.isPending && styles.disabledButton]}
              onPress={() => !item.isPending && handleEditar(item)}
              disabled={item.isPending}
            >
              <Ionicons name="pencil" size={20} color={item.isPending ? "#bdc3c7" : "#3498db"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, item.isPending && styles.disabledButton]}
              onPress={() => !item.isPending && handleEliminar(item)}
              disabled={item.isPending}
            >
              <Ionicons name="trash" size={20} color={item.isPending ? "#bdc3c7" : "#e74c3c"} />
            </TouchableOpacity>
          </View>
        </View>

        {item.isPending && (
          <View style={styles.pendingBadge}>
            <Ionicons name="cloud-offline-outline" size={14} color="#e67e22" />
            <Text style={styles.pendingBadgeText}>Pendiente de sincronizar</Text>
          </View>
        )}

        <View style={styles.ventaBody}>
          <View style={styles.ventaRow}>
            <Text style={styles.ventaLabel}>Producto:</Text>
            <Text style={styles.ventaValue}>
              {item.tipo_producto} ({formatNumber(item.cantidad)} unidades)
            </Text>
          </View>

          <View style={styles.ventaRow}>
            <Text style={styles.ventaLabel}>Precio unitario:</Text>
            <Text style={styles.ventaValue}>${formatNumber(item.precio_unitario)}</Text>
          </View>

          <View style={styles.ventaRow}>
            <Text style={styles.ventaLabel}>Total:</Text>
            <Text style={styles.totalText}>${formatNumber(item.total)}</Text>
          </View>

          <View style={styles.ventaRow}>
            <Text style={styles.ventaLabel}>Forma de pago:</Text>
            <View
              style={[
                styles.formaPagoBadge,
                { backgroundColor: getFormaPagoColor(item.forma_pago) },
              ]}
            >
              <Text style={styles.formaPagoText}>
                {getFormaPagoLabel(item.forma_pago)}
              </Text>
            </View>
          </View>

          {item.forma_pago === 'CREDITO' && (
            <View style={styles.creditoContainer}>
              <View style={styles.ventaRow}>
                <Text style={styles.ventaLabel}>Total Venta:</Text>
                <Text style={styles.totalText}>${formatNumber(item.total)}</Text>
              </View>

              <View style={styles.abonosHeader}>
                <Text style={styles.abonosTitle}>Historial de Abonos:</Text>
                <TouchableOpacity
                  style={styles.addAbonoButton}
                  onPress={() => navigation.navigate('AddAbono', { venta: item })}
                >
                  <Ionicons name="add-circle" size={20} color="#27ae60" />
                  <Text style={styles.addAbonoText}>Abonar</Text>
                </TouchableOpacity>
              </View>

              {(!item.abonos || item.abonos.length === 0) && (item.abono || 0) > 0 ? (
                <View style={styles.abonoItem}>
                  <Text style={styles.abonoFecha}>{formatDate(item.fecha)}</Text>
                  <Text style={styles.abonoMonto}>${formatNumber(item.abono || 0)}</Text>
                </View>
              ) : (
                item.abonos?.map((abono, index) => (
                  <View key={index} style={styles.abonoItem}>
                    <Text style={styles.abonoFecha}>{formatDate(abono.fecha)}</Text>
                    <Text style={styles.abonoMonto}>${formatNumber(abono.monto)}</Text>
                  </View>
                ))
              )}

              <View style={[styles.ventaRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 }]}>
                <Text style={styles.ventaLabel}>Saldo pendiente:</Text>
                <Text style={[styles.ventaValue, styles.saldoText]}>
                  ${formatNumber(saldoPendiente)}
                </Text>
              </View>
            </View>
          )}

          {item.observaciones && (
            <View style={styles.observacionesContainer}>
              <Text style={styles.observacionesLabel}>Observaciones:</Text>
              <Text style={styles.observacionesText}>{item.observaciones}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Cargando ventas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateVenta')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Nueva Venta</Text>
        </TouchableOpacity>
      </View>

      {ventas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyText}>No hay ventas registradas</Text>
          <Text style={styles.emptySubtext}>
            Presiona "Nueva Venta" para agregar una
          </Text>
        </View>
      ) : (
        <FlatList
          data={ventas}
          renderItem={renderVenta}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#27ae60']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  ventaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ventaHeaderLeft: {
    flex: 1,
  },
  ventaHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  clienteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ventaBody: {
    padding: 16,
  },
  ventaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventaLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ventaValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  saldoText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formaPagoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formaPagoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  observacionesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  observacionesLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  observacionesText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
  },
  creditoContainer: {
    backgroundColor: '#fff9f4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe0cc',
    marginTop: 8,
  },
  abonosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  abonosTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  addAbonoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addAbonoText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  abonoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  abonoFecha: {
    fontSize: 12,
    color: '#95a5a6',
  },
  abonoMonto: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#e67e22',
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
});