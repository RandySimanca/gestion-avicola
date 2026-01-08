import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function GastosScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    // Robust admin check consistent with other screens
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN' ||
        user?.role?.toUpperCase() === 'PROPIETARIO' ||
        user?.role?.toUpperCase() === 'GERENTE';

    const [loteId, setLoteId] = useState('');
    const [concepto, setConcepto] = useState('');
    const [tipoGasto, setTipoGasto] = useState<'NOMINA' | 'SERVICIOS_PUBLICOS' | 'ARRIENDO' | 'MANTENIMIENTO' | 'ASEO' | 'OTRO'>('OTRO');
    const [cantidad, setCantidad] = useState('1');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [observaciones, setObservaciones] = useState('');
    const [gastos, setGastos] = useState<any[]>([]);
    const [lotesMap, setLotesMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        loadGastos();
        loadLotes();
    }, [loteId]);

    const loadLotes = async () => {
        const response = await apiService.getLotes();
        if (response.success && response.data) {
            const map: Record<string, string> = {};
            response.data.forEach((l: any) => map[l.id] = l.nombre);
            setLotesMap(map);
        }
    };

    const loadGastos = async () => {
        setLoadingList(true);
        try {
            const response = await apiService.getGastos(loteId || undefined);
            if (response.success) {
                setGastos(response.data || []);
            }
        } catch (error) {
            console.error('Error loading gastos:', error);
        } finally {
            setLoadingList(false);
        }
    };

    const handleSave = async () => {
        if (!concepto || !precioUnitario || !cantidad) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const total = parseFloat(cantidad) * parseFloat(precioUnitario);
        const data: any = {
            fecha: new Date().toISOString(),
            concepto,
            tipo_gasto: tipoGasto,
            cantidad: parseFloat(cantidad),
            precio_unitario: parseFloat(precioUnitario),
            total,
            metodo_pago: metodoPago,
        };
        
        // Solo incluir campos opcionales si tienen valor
        if (loteId) data.lote_id = loteId;
        if (proveedor) data.proveedor = proveedor;
        if (observaciones) data.observaciones = observaciones;

        setLoading(true);
        try {
            const response = await apiService.createGasto(data);
            if (response.success) {
                Alert.alert('Éxito', 'Gasto operativo registrado correctamente');
                setConcepto('');
                setPrecioUnitario('');
                setCantidad('1');
                setProveedor('');
                setObservaciones('');
                setLoteId('');
                setShowForm(false);
                loadGastos();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar el gasto');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Confirmar',
            '¿Estás seguro de eliminar este registro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteGasto(id);
                            if (response.success) {
                                loadGastos();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar');
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderGastoItem = ({ item }: { item: any }) => (
        <View style={styles.gastoCard}>
            <View style={styles.gastoInfo}>
                <Text style={styles.gastoConcepto}>{item.concepto}</Text>
                <Text style={styles.gastoMeta}>
                    {new Date(item.fecha).toLocaleDateString()} • {item.tipo_gasto}
                    {item.lote_id && lotesMap[item.lote_id] ? ` • ${lotesMap[item.lote_id]}` : ''}
                </Text>
                <Text style={styles.gastoDetalle}>
                    {item.cantidad} x {formatCurrency(item.precio_unitario)}
                </Text>
            </View>
            <View style={styles.gastoRight}>
                <Text style={styles.gastoTotal}>{formatCurrency(item.total)}</Text>
                <View style={styles.actionButtons}>
                    {isAdmin && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditGasto', { gastoId: item.id })}
                            style={styles.actionButton}
                        >
                            <Ionicons name="pencil-outline" size={20} color="#3498db" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gastos Operativos</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowForm(!showForm)}
                >
                    <Ionicons name={showForm ? "close" : "add"} size={24} color="#fff" />
                    <Text style={styles.addButtonText}>{showForm ? "Cancelar" : "Nuevo Registro"}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <ScrollView style={styles.form}>
                    <Text style={styles.label}>Tipo de Gasto Operativo *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={tipoGasto}
                            onValueChange={(v: any) => setTipoGasto(v)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Nómina" value="NOMINA" />
                            <Picker.Item label="Servicios Públicos" value="SERVICIOS_PUBLICOS" />
                            <Picker.Item label="Arriendo" value="ARRIENDO" />
                            <Picker.Item label="Mantenimiento" value="MANTENIMIENTO" />
                            <Picker.Item label="Aseo" value="ASEO" />
                            <Picker.Item label="Otro" value="OTRO" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Lote (Opcional)</Text>
                    <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                    <Text style={styles.label}>Concepto *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: Pago de nómina, Arriendo, Servicio de luz..."
                        placeholderTextColor="#999"
                        value={concepto}
                        onChangeText={setConcepto}
                    />

                    <View style={styles.row}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Cantidad *</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                                value={cantidad}
                                onChangeText={setCantidad}
                            />
                        </View>
                        <View style={[styles.flex1, { marginLeft: 10 }]}>
                            <Text style={styles.label}>Costo Unitario *</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#999"
                                value={precioUnitario}
                                onChangeText={setPrecioUnitario}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Proveedor (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nombre del proveedor"
                        placeholderTextColor="#999"
                        value={proveedor}
                        onChangeText={setProveedor}
                    />

                    <Text style={styles.label}>Método de Pago</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={metodoPago}
                            onValueChange={(v) => setMetodoPago(v)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Efectivo" value="EFECTIVO" />
                            <Picker.Item label="Transferencia" value="TRANSFERENCIA" />
                            <Picker.Item label="Crédito" value="CREDITO" />
                        </Picker>
                    </View>

                    <Text style={styles.label}>Observaciones (Opcional)</Text>
                    <TextInput
                        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Notas adicionales..."
                        placeholderTextColor="#999"
                        value={observaciones}
                        onChangeText={setObservaciones}
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Registro</Text>}
                    </TouchableOpacity>
                </ScrollView>
            )}

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Historial de Gastos Operativos</Text>
                {loadingList ? (
                    <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={gastos}
                        renderItem={renderGastoItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={<Text style={styles.emptyText}>No hay registros para mostrar</Text>}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addButton: { backgroundColor: '#27ae60', flexDirection: 'row', padding: 8, borderRadius: 8, alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
    form: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9', color: '#2c3e50' },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
    picker: { color: '#2c3e50' },
    row: { flexDirection: 'row' },
    flex1: { flex: 1 },
    saveButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    listSection: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#34495e', marginBottom: 15 },
    gastoCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
    gastoInfo: { flex: 1 },
    gastoConcepto: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    gastoMeta: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    gastoDetalle: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
    gastoRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
    gastoTotal: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
    actionButtons: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    actionButton: { padding: 5, marginLeft: 5 },
    emptyText: { textAlign: 'center', color: '#95a5a6', marginTop: 40, fontStyle: 'italic' },
});