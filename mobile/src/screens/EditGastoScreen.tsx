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
import apiService from '../services/api-service';
import LoteSelector from '../components/LoteSelector';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootDrawerParamList, 'EditGasto'>;

export default function EditGastoScreen({ route, navigation }: Props) {
    const { gastoId } = route.params;
    const [loteId, setLoteId] = useState('');
    const [concepto, setConcepto] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [metodoPago, setMetodoPago] = useState('EFECTIVO');
    const [insumoId, setInsumoId] = useState('');
    const [tipoGasto, setTipoGasto] = useState<'COMPRA_INSUMO' | 'GASTO_OPERATIVO'>('GASTO_OPERATIVO');
    const [insumos, setInsumos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [gastoRes, insumosRes] = await Promise.all([
                apiService.getGasto(gastoId),
                apiService.getInsumos()
            ]);

            if (insumosRes.success) {
                setInsumos(insumosRes.data || []);
            }

            if (gastoRes.success && gastoRes.data) {
                const gasto = gastoRes.data;
                setLoteId(gasto.lote_id || '');
                setConcepto(gasto.concepto);
                setCantidad(gasto.cantidad.toString());
                setPrecioUnitario(gasto.precio_unitario.toString());
                setProveedor(gasto.proveedor || '');
                setMetodoPago(gasto.metodo_pago);
                setInsumoId(gasto.insumo_id || '');
                setTipoGasto(gasto.tipo_gasto || 'GASTO_OPERATIVO');
            } else {
                Alert.alert('Error', 'No se pudo cargar la información del gasto');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Error al cargar datos');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!concepto || !precioUnitario || !cantidad) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const total = parseFloat(cantidad) * parseFloat(precioUnitario);
        const data = {
            lote_id: loteId || null,
            concepto,
            categoria: tipoGasto === 'COMPRA_INSUMO' ? 'INVERSION' : 'GASTO',
            cantidad: parseFloat(cantidad),
            precio_unitario: parseFloat(precioUnitario),
            total,
            proveedor,
            metodo_pago: metodoPago,
            insumo_id: insumoId || null,
            tipo_gasto: tipoGasto,
        };

        setSaving(true);
        try {
            const response = await apiService.updateGasto(gastoId, data);
            if (response.success) {
                Alert.alert('Éxito', 'Gasto actualizado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el gasto');
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
                <Text style={styles.headerTitle}>Editar Gasto</Text>

                <Text style={styles.label}>Tipo de Registro *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipoGasto}
                        onValueChange={(v: any) => setTipoGasto(v)}
                        style={styles.picker}
                        dropdownIconColor="#000"
                        enabled={false} // No permitir cambiar tipo para evitar inconsistencias complejas
                    >
                        <Picker.Item label="Gasto Operativo" value="GASTO_OPERATIVO" />
                        <Picker.Item label="Compra de Insumo" value="COMPRA_INSUMO" />
                    </Picker>
                </View>
                <Text style={styles.helperText}>El tipo de gasto no se puede cambiar en la edición.</Text>

                {tipoGasto === 'COMPRA_INSUMO' ? (
                    <>
                        <Text style={styles.label}>Insumo *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={insumoId}
                                onValueChange={(v) => {
                                    setInsumoId(v);
                                    const insumo = insumos.find(i => i.id === v);
                                    if (insumo) setConcepto(`Compra: ${insumo.nombre_producto}`);
                                }}
                                style={styles.picker}
                                dropdownIconColor="#000"
                            >
                                <Picker.Item label="Seleccione un insumo..." value="" />
                                {insumos.map(i => (
                                    <Picker.Item key={i.id} label={`${i.nombre_producto} (${i.tipo})`} value={i.id} />
                                ))}
                            </Picker>
                        </View>
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Lote (Opcional)</Text>
                        <LoteSelector onSelect={(lote) => setLoteId(lote.id)} selectedLoteId={loteId} />

                        <Text style={styles.label}>Concepto *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Pago de nómina..."
                            value={concepto}
                            onChangeText={setConcepto}
                        />
                    </>
                )}

                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Cantidad *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={cantidad}
                            onChangeText={setCantidad}
                        />
                    </View>
                    <View style={[styles.flex1, { marginLeft: 10 }]}>
                        <Text style={styles.label}>Costo Unitario *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={precioUnitario}
                            onChangeText={setPrecioUnitario}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Proveedor (Opcional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del proveedor"
                    value={proveedor}
                    onChangeText={setProveedor}
                />

                <Text style={styles.label}>Método de Pago</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={metodoPago}
                        onValueChange={(v) => setMetodoPago(v)}
                        style={styles.picker}
                        dropdownIconColor="#000"
                    >
                        <Picker.Item label="Efectivo" value="EFECTIVO" />
                        <Picker.Item label="Transferencia" value="TRANSFERENCIA" />
                        <Picker.Item label="Crédito" value="CREDITO" />
                    </Picker>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7f8c8d',
        marginBottom: 8,
        marginTop: 12,
    },
    helperText: {
        fontSize: 12,
        color: '#95a5a6',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        color: '#000',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginBottom: 8,
    },
    picker: {
        color: '#000',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
    },
    saveButton: {
        backgroundColor: '#27ae60',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: '#95a5a6',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
