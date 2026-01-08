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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';
import FincaSelector from '../components/FincaSelector';
import GalponSelector from '../components/GalponSelector';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootDrawerParamList, 'EditCompra'>;

export default function EditCompraScreen({ route, navigation }: Props) {
    const { compraId } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [tipoCompra, setTipoCompra] = useState<'LOTE' | 'INSUMO'>('LOTE');

    // Estados para compra de LOTE
    const [nombreLote, setNombreLote] = useState('');
    const [tipoAve, setTipoAve] = useState<'DESCARTE' | 'ENGORDE' | 'PONEDORA'>('ENGORDE');
    const [poblacionInicial, setPoblacionInicial] = useState('');
    const [precioCompraUnitario, setPrecioCompraUnitario] = useState('');
    const [selectedFinca, setSelectedFinca] = useState<any>(null);
    const [selectedGalpon, setSelectedGalpon] = useState<any>(null);

    // Estados para compra de INSUMO
    const [insumoId, setInsumoId] = useState('');
    const [nombreInsumo, setNombreInsumo] = useState('');
    const [cantidadInsumo, setCantidadInsumo] = useState('');
    const [precioUnitarioInsumo, setPrecioUnitarioInsumo] = useState('');

    // Estados comunes
    const [proveedor, setProveedor] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [observaciones, setObservaciones] = useState('');
    const [fecha, setFecha] = useState('');

    useEffect(() => {
        loadCompraData();
    }, []);

    const loadCompraData = async () => {
        try {
            const response = await apiService.getGasto(compraId);
            if (response.success && response.data) {
                const data = response.data;
                setTipoCompra(data.tipo_gasto === 'COMPRA_LOTE' ? 'LOTE' : 'INSUMO');
                setFecha(data.fecha);
                setMetodoPago(data.metodo_pago || 'EFECTIVO');
                setProveedor(data.proveedor || '');
                setObservaciones(data.observaciones || '');

                if (data.tipo_gasto === 'COMPRA_LOTE') {
                    // Cargar datos del lote
                    const loteRes = await apiService.getLote(data.lote_id);
                    if (loteRes.success && loteRes.data) {
                        const lote = loteRes.data;
                        setNombreLote(lote.nombre);
                        setTipoAve(lote.tipo_ave);
                        setPoblacionInicial(lote.poblacion_inicial.toString());
                        setPrecioCompraUnitario(lote.precio_compra_unitario.toString());
                        setSelectedFinca({ id: lote.finca_id, nombre: lote.finca_nombre });
                        setSelectedGalpon({ id: lote.galpon_id, nombre: lote.galpon_nombre });
                    }
                } else {
                    setInsumoId(data.insumo_id || '');
                    setNombreInsumo(data.concepto.replace('Compra: ', ''));
                    setCantidadInsumo(data.cantidad.toString());
                    setPrecioUnitarioInsumo(data.precio_unitario.toString());
                }
            } else {
                Alert.alert('Error', 'No se pudo cargar la información de la compra');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading compra data:', error);
            Alert.alert('Error', 'Ocurrió un error al cargar los datos');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
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
            if (!nombreLote || !poblacionInicial || !precioCompraUnitario) {
                Alert.alert('Error', 'Por favor completa los campos obligatorios');
                return;
            }
        } else {
            if (!cantidadInsumo || !precioUnitarioInsumo) {
                Alert.alert('Error', 'Por favor completa cantidad y precio unitario');
                return;
            }
        }

        setSaving(true);
        try {
            const total = calcularTotal();
            const updateData: any = {
                tipo_compra: tipoCompra,
                fecha,
                total,
                metodo_pago: metodoPago,
                proveedor,
                observaciones,
            };

            if (tipoCompra === 'LOTE') {
                updateData.nombre_lote = nombreLote;
                updateData.tipo_ave = tipoAve;
                updateData.poblacion_inicial = parseFloat(poblacionInicial);
                updateData.precio_compra_unitario = parseFloat(precioCompraUnitario);
            } else {
                updateData.cantidad = parseFloat(cantidadInsumo);
                updateData.precio_unitario = parseFloat(precioUnitarioInsumo);
                updateData.nombre_insumo = nombreInsumo;
            }

            const response = await apiService.updateCompra(compraId, updateData);
            if (response.success) {
                Alert.alert('Éxito', 'Compra actualizada correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar la compra');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Error desconocido');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#27ae60" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.headerTitle}>Editar Compra de {tipoCompra === 'LOTE' ? 'Lote' : 'Insumo'}</Text>

                {tipoCompra === 'LOTE' ? (
                    <>
                        <Text style={styles.label}>Nombre del Lote *</Text>
                        <TextInput
                            style={styles.input}
                            value={nombreLote}
                            onChangeText={setNombreLote}
                        />

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
                                    value={poblacionInicial}
                                    onChangeText={setPoblacionInicial}
                                />
                            </View>
                            <View style={[styles.flex1, { marginLeft: 10 }]}>
                                <Text style={styles.label}>Precio Unitario *</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={precioCompraUnitario}
                                    onChangeText={setPrecioCompraUnitario}
                                />
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Nombre del Insumo</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#eee' }]}
                            value={nombreInsumo}
                            editable={false}
                        />

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Text style={styles.label}>Cantidad *</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={cantidadInsumo}
                                    onChangeText={setCantidadInsumo}
                                />
                            </View>
                            <View style={[styles.flex1, { marginLeft: 10 }]}>
                                <Text style={styles.label}>Precio Unitario *</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={precioUnitarioInsumo}
                                    onChangeText={setPrecioUnitarioInsumo}
                                />
                            </View>
                        </View>
                    </>
                )}

                <Text style={styles.label}>Proveedor</Text>
                <TextInput
                    style={styles.input}
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

                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, { minHeight: 60 }]}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    multiline
                />

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(calcularTotal())}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Cambios</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9', color: '#2c3e50' },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
    picker: { color: '#2c3e50' },
    row: { flexDirection: 'row' },
    flex1: { flex: 1 },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 8 },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: '#27ae60' },
    saveButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
