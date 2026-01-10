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
  observaciones?: string;
}

export default function VentasScreen({ navigation }: any) {
  const { currentBusiness } = useBusiness();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarVentas();
  }, [currentBusiness]);

  const cargarVentas = async () => {
    try {
      const response = await apiService.getVentas(currentBusiness);
      if (response.success && response.data) {
        // Ordenar por fecha descendente
        const ventasOrdenadas = response.data.sort((a: any, b: any) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        setVentas(ventasOrdenadas);
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
              style={styles.iconButton}
              onPress={() => handleEditar(item)}
            >
              <Ionicons name="pencil" size={20} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleEliminar(item)}
            >
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        </View>

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
            <>
              <View style={styles.ventaRow}>
                <Text style={styles.ventaLabel}>Abono:</Text>
                <Text style={styles.ventaValue}>${formatNumber(item.abono || 0)}</Text>
              </View>
              <View style={styles.ventaRow}>
                <Text style={styles.ventaLabel}>Saldo pendiente:</Text>
                <Text style={[styles.ventaValue, styles.saldoText]}>
                  ${formatNumber(saldoPendiente)}
                </Text>
              </View>
            </>
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
    color: '#e67e22',
    fontWeight: 'bold',
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
});