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
import FincaSelector from '../components/FincaSelector';
import GalponSelector from '../components/GalponSelector';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ComprasScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const isAdmin = user?.role?.toUpperCase() === 'ADMIN' ||
        user?.role?.toUpperCase() === 'PROPIETARIO' ||
        user?.role?.toUpperCase() === 'GERENTE';

    const [tipoCompra, setTipoCompra] = useState<'LOTE' | 'INSUMO'>('LOTE');
    const [showForm, setShowForm] = useState(false);

    // Estados para compra de LOTE
    const [nombreLote, setNombreLote] = useState('');
    const [tipoAve, setTipoAve] = useState<'DESCARTE' | 'ENGORDE' | 'PONEDORA'>('ENGORDE');
    const [poblacionInicial, setPoblacionInicial] = useState('');
    const [precioCompraUnitario, setPrecioCompraUnitario] = useState('');
    const [selectedFinca, setSelectedFinca] = useState<any>(null);
    const [selectedGalpon, setSelectedGalpon] = useState<any>(null);

    // Estados para compra de INSUMO
    const [insumoId, setInsumoId] = useState('');
    const [crearNuevoInsumo, setCrearNuevoInsumo] = useState(false);
    const [nombreInsumo, setNombreInsumo] = useState('');
    const [tipoInsumo, setTipoInsumo] = useState<'ALIMENTO' | 'MEDICAMENTO' | 'VACUNA' | 'VITAMINA' | 'DESINFECTANTE' | 'OTRO'>('ALIMENTO');
    const [unidadMedida, setUnidadMedida] = useState('');
    const [cantidadInsumo, setCantidadInsumo] = useState('');
    const [precioUnitarioInsumo, setPrecioUnitarioInsumo] = useState('');

    // Estados comunes
    const [proveedor, setProveedor] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [observaciones, setObservaciones] = useState('');

    // Estados para listado
    const [compras, setCompras] = useState<any[]>([]);
    const [insumos, setInsumos] = useState<any[]>([]);
    const [lotesMap, setLotesMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    useEffect(() => {
        loadCompras();
        loadInsumos();
        loadLotes();
    }, []);

    const loadLotes = async () => {
        const response = await apiService.getLotes();
        if (response.success && response.data) {
            const map: Record<string, string> = {};
            response.data.forEach((l: any) => map[l.id] = l.nombre);
            setLotesMap(map);
        }
    };

    const loadInsumos = async () => {
        try {
            const response = await apiService.getInsumos();
            if (response.success) {
                setInsumos(response.data || []);
            }
        } catch (error) {
            console.error('Error loading insumos:', error);
        }
    };

    const loadCompras = async () => {
        setLoadingList(true);
        try {
            const response = await apiService.getCompras();
            if (response.success) {
                const comprasData = response.data || [];
                console.log('Compras cargadas:', comprasData.length, comprasData);
                setCompras(comprasData);
            } else {
                console.error('Error en respuesta de getCompras:', response.error);
            }
        } catch (error) {
            console.error('Error loading compras:', error);
        } finally {
            setLoadingList(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Confirmar Eliminación',
            '¿Estás seguro de eliminar esta compra? Si es un lote se eliminará el lote, si es un insumo se revertirá el stock.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteCompra(id);
                            if (response.success) {
                                Alert.alert('Éxito', 'Compra eliminada y valores revertidos');
                                loadCompras();
                            } else {
                                Alert.alert('Error', response.error || 'No se pudo eliminar');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const calcularTotal = (): number => {
        if (tipoCompra === 'LOTE') {
            const cantidad = parseFloat(poblacionInicial) || 0;
            const precio = parseFloat(precioCompraUnitario) || 0;
            return cantidad * precio;
        } else {
            const cantidad = parseFloat(cantidadInsumo) || 0;
            const precio = parseFloat(precioUnitarioInsumo) || 0;
            return cantidad * precio;
        }
    };

    const handleSave = async () => {
        if (tipoCompra === 'LOTE') {
            if (!nombreLote || !poblacionInicial || !precioCompraUnitario || !selectedFinca || !selectedGalpon) {
                Alert.alert('Error', 'Por favor completa todos los campos obligatorios para compra de lote');
                return;
            }
        } else {
            if (!crearNuevoInsumo && !insumoId) {
                Alert.alert('Error', 'Por favor selecciona un insumo o crea uno nuevo');
                return;
            }
            if (crearNuevoInsumo && (!nombreInsumo || !tipoInsumo || !unidadMedida)) {
                Alert.alert('Error', 'Por favor completa todos los campos para crear nuevo insumo');
                return;
            }
            if (!cantidadInsumo || !precioUnitarioInsumo) {
                Alert.alert('Error', 'Por favor completa cantidad y precio unitario');
                return;
            }
        }

        const total = calcularTotal();
        if (total <= 0) {
            Alert.alert('Error', 'El total debe ser mayor a 0');
            return;
        }

        setLoading(true);
        try {
            const compraData: any = {
                tipo_compra: tipoCompra,
                fecha: new Date().toISOString(),
                total,
                metodo_pago: metodoPago,
            };

            // Solo incluir campos opcionales si tienen valor
            if (proveedor) compraData.proveedor = proveedor;
            if (observaciones) compraData.observaciones = observaciones;

            if (tipoCompra === 'LOTE') {
                compraData.nombre_lote = nombreLote;
                compraData.tipo_ave = tipoAve;
                compraData.poblacion_inicial = parseFloat(poblacionInicial);
                compraData.precio_compra_unitario = parseFloat(precioCompraUnitario);
                compraData.finca_id = selectedFinca.id;
                compraData.galpon_id = selectedGalpon.id;
            } else {
                compraData.cantidad = parseFloat(cantidadInsumo);
                compraData.precio_unitario = parseFloat(precioUnitarioInsumo);
                if (insumoId) {
                    compraData.insumo_id = insumoId;
                } else {
                    compraData.nombre_insumo = nombreInsumo;
                    compraData.tipo_insumo = tipoInsumo;
                    compraData.unidad_medida = unidadMedida;
                }
            }

            const response = await apiService.createCompra(compraData);
            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Compra guardada localmente. Se sincronizará al recuperar conexión.'
                        : tipoCompra === 'LOTE'
                            ? `Lote "${nombreLote}" comprado correctamente`
                            : 'Compra de insumo registrada correctamente'
                );

                // Limpiar formulario
                resetForm();
                setShowForm(false);
                loadCompras();
                if (tipoCompra === 'LOTE') {
                    loadLotes();
                } else {
                    loadInsumos();
                }
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar la compra');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNombreLote('');
        setPoblacionInicial('');
        setPrecioCompraUnitario('');
        setSelectedFinca(null);
        setSelectedGalpon(null);
        setInsumoId('');
        setCrearNuevoInsumo(false);
        setNombreInsumo('');
        setUnidadMedida('');
        setCantidadInsumo('');
        setPrecioUnitarioInsumo('');
        setProveedor('');
        setObservaciones('');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderCompraItem = ({ item }: { item: any }) => {
        const tipoCompra = item.tipo_gasto === 'COMPRA_LOTE' ? 'Lote' : 'Insumo';
        const loteNombre = item.lote_id && lotesMap[item.lote_id] ? lotesMap[item.lote_id] : null;

        return (
            <View style={styles.compraCard}>
                <View style={styles.compraInfo}>
                    <Text style={styles.compraConcepto}>{item.concepto}</Text>
                    <Text style={styles.compraMeta}>
                        {new Date(item.fecha).toLocaleDateString()} • {tipoCompra}
                        {loteNombre ? ` • ${loteNombre}` : ''}
                    </Text>
                    <Text style={styles.compraDetalle}>
                        {item.cantidad} x {formatCurrency(item.precio_unitario)}
                    </Text>
                </View>
                <View style={styles.compraRight}>
                    <Text style={styles.compraTotal}>{formatCurrency(item.total)}</Text>
                    {isAdmin && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('EditCompra', { compraId: item.id })}
                                style={styles.actionButton}
                            >
                                <Ionicons name="pencil-outline" size={20} color="#3498db" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDelete(item.id)}
                                style={styles.actionButton}
                            >
                                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Compras</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowForm(!showForm)}
                >
                    <Ionicons name={showForm ? "close" : "add"} size={24} color="#fff" />
                    <Text style={styles.addButtonText}>{showForm ? "Cancelar" : "Nueva Compra"}</Text>
                </TouchableOpacity>
            </View>

            {showForm && (
                <ScrollView style={styles.form}>
                    <Text style={styles.label}>Tipo de Compra *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={tipoCompra}
                            onValueChange={(v: 'LOTE' | 'INSUMO') => {
                                setTipoCompra(v);
                                resetForm();
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Compra de Lote" value="LOTE" />
                            <Picker.Item label="Compra de Insumo" value="INSUMO" />
                        </Picker>
                    </View>

                    {tipoCompra === 'LOTE' ? (
                        <>
                            <Text style={styles.label}>Nombre del Lote *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Lote A-2025"
                                placeholderTextColor="#999"
                                value={nombreLote}
                                onChangeText={setNombreLote}
                            />

                            <Text style={styles.label}>Finca *</Text>
                            <FincaSelector
                                onSelect={(finca) => {
                                    setSelectedFinca(finca);
                                    setSelectedGalpon(null);
                                }}
                                selectedFincaId={selectedFinca?.id}
                            />

                            {selectedFinca && (
                                <>
                                    <Text style={styles.label}>Galpón *</Text>
                                    <GalponSelector
                                        fincaId={selectedFinca.id}
                                        onSelect={setSelectedGalpon}
                                        selectedGalponId={selectedGalpon?.id}
                                    />
                                </>
                            )}

                            <Text style={styles.label}>Tipo de Ave *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={tipoAve}
                                    onValueChange={(v: any) => setTipoAve(v)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Descarte" value="DESCARTE" />
                                    <Picker.Item label="Engorde" value="ENGORDE" />
                                    <Picker.Item label="Ponedora" value="PONEDORA" />
                                </Picker>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.flex1}>
                                    <Text style={styles.label}>Población Inicial *</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="1000"
                                        placeholderTextColor="#999"
                                        value={poblacionInicial}
                                        onChangeText={setPoblacionInicial}
                                    />
                                </View>
                                <View style={[styles.flex1, { marginLeft: 10 }]}>
                                    <Text style={styles.label}>Precio Unitario *</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="5000"
                                        placeholderTextColor="#999"
                                        value={precioCompraUnitario}
                                        onChangeText={setPrecioCompraUnitario}
                                    />
                                </View>
                            </View>

                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>Total de la compra:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(calcularTotal())}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Tipo de Insumo</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={crearNuevoInsumo ? 'NUEVO' : 'EXISTENTE'}
                                    onValueChange={(v) => {
                                        setCrearNuevoInsumo(v === 'NUEVO');
                                        setInsumoId('');
                                        setNombreInsumo('');
                                    }}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Seleccionar Insumo Existente" value="EXISTENTE" />
                                    <Picker.Item label="Crear Nuevo Insumo" value="NUEVO" />
                                </Picker>
                            </View>

                            {crearNuevoInsumo ? (
                                <>
                                    <Text style={styles.label}>Nombre del Insumo *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej: Alimento Balanceado Premium"
                                        placeholderTextColor="#999"
                                        value={nombreInsumo}
                                        onChangeText={setNombreInsumo}
                                    />

                                    <Text style={styles.label}>Tipo de Insumo *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={tipoInsumo}
                                            onValueChange={(v: any) => setTipoInsumo(v)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Alimento" value="ALIMENTO" />
                                            <Picker.Item label="Medicamento" value="MEDICAMENTO" />
                                            <Picker.Item label="Vacuna" value="VACUNA" />
                                            <Picker.Item label="Vitamina" value="VITAMINA" />
                                            <Picker.Item label="Desinfectante" value="DESINFECTANTE" />
                                            <Picker.Item label="Otro" value="OTRO" />
                                        </Picker>
                                    </View>

                                    <Text style={styles.label}>Unidad de Medida *</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej: kg, litros, unidades"
                                        placeholderTextColor="#999"
                                        value={unidadMedida}
                                        onChangeText={setUnidadMedida}
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={styles.label}>Insumo a Comprar *</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={insumoId}
                                            onValueChange={setInsumoId}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Seleccione un insumo..." value="" />
                                            {insumos.map(i => (
                                                <Picker.Item
                                                    key={i.id}
                                                    label={`${i.nombre_producto} (${i.tipo}) - Stock: ${i.stock_actual} ${i.unidad_medida}`}
                                                    value={i.id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </>
                            )}

                            <View style={styles.row}>
                                <View style={styles.flex1}>
                                    <Text style={styles.label}>Cantidad *</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="50"
                                        placeholderTextColor="#999"
                                        value={cantidadInsumo}
                                        onChangeText={setCantidadInsumo}
                                    />
                                </View>
                                <View style={[styles.flex1, { marginLeft: 10 }]}>
                                    <Text style={styles.label}>Precio Unitario *</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="45000"
                                        placeholderTextColor="#999"
                                        value={precioUnitarioInsumo}
                                        onChangeText={setPrecioUnitarioInsumo}
                                    />
                                </View>
                            </View>

                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>Total de la compra:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(calcularTotal())}</Text>
                            </View>
                        </>
                    )}

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
                        style={[styles.input, styles.textArea]}
                        placeholder="Notas adicionales..."
                        placeholderTextColor="#999"
                        value={observaciones}
                        onChangeText={setObservaciones}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calcularTotal())}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Registrar Compra</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Historial de Compras</Text>
                {loadingList ? (
                    <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={compras}
                        renderItem={renderCompraItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No hay compras registradas</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    addButton: {
        backgroundColor: '#27ae60',
        flexDirection: 'row',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4 },
    form: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 5,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f9f9f9',
        color: '#2c3e50',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: { color: '#2c3e50' },
    row: { flexDirection: 'row' },
    flex1: { flex: 1 },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
    },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#27ae60' },
    saveButton: {
        backgroundColor: '#27ae60',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    listSection: { flex: 1, padding: 20 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 15,
    },
    compraCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        elevation: 1,
    },
    compraInfo: { flex: 1 },
    compraConcepto: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
    compraMeta: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
    compraDetalle: { fontSize: 13, color: '#7f8c8d', marginTop: 4 },
    compraRight: { alignItems: 'flex-end', justifyContent: 'center' },
    compraTotal: { fontSize: 16, fontWeight: 'bold', color: '#e74c3c' },
    emptyText: {
        textAlign: 'center',
        color: '#95a5a6',
        marginTop: 40,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 10,
    },
    actionButton: {
        padding: 5,
        marginLeft: 10,
    },
});
