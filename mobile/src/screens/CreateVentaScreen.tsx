import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../navigation/AppNavigator';
import { useBusiness } from '../context/BusinessContext';
import { TipoNegocio } from '../types/business';

type CreateVentaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'CreateVenta'>;

interface Props {
    navigation: CreateVentaScreenNavigationProp;
}

export default function CreateVentaScreen({ navigation }: Props) {
    const { tipoNegocio } = useBusiness();
    const [loteId, setLoteId] = useState('');
    const [loteNombre, setLoteNombre] = useState('');
    const [loteTipo, setLoteTipo] = useState('');
    const [tipoProducto, setTipoProducto] = useState(tipoNegocio === TipoNegocio.DESCARTE ? 'AVES' : 'HUEVOS'); // 'AVES' o 'HUEVOS'
    const [tamañoHuevo, setTamañoHuevo] = useState('AAA');
    const [cantidad, setCantidad] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState('');
    const [cliente, setCliente] = useState('');
    const [formaPago, setFormaPago] = useState('CONTADO_EFECTIVO');
    const [observaciones, setObservaciones] = useState('');
    const [abono, setAbono] = useState('');
    const [fecha, setFecha] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!loteId || !cantidad || !precioUnitario || !cliente || !formaPago) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        const cant = parseInt(cantidad);
        const precio = parseFloat(precioUnitario);
        const abonoVal = parseFloat(abono) || 0;

        if (isNaN(cant) || cant <= 0) {
            Alert.alert('Error', 'La cantidad debe ser un número válido mayor a 0');
            return;
        }

        if (isNaN(precio) || precio <= 0) {
            Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
            return;
        }

        const total = cant * precio;

        if (formaPago === 'CREDITO' && abonoVal > total) {
            Alert.alert('Error', 'El abono no puede ser mayor al total de la venta');
            return;
        }

        const data = {
            lote_id: loteId,
            lote_nombre: loteNombre,
            tipo_producto: tipoProducto,
            tipo_negocio: tipoNegocio,
            tamaño_huevo: tipoProducto === 'HUEVOS' ? tamañoHuevo : null,
            cantidad: cant,
            precio_unitario: precio,
            total,
            abono: abonoVal,
            cliente,
            forma_pago: formaPago,
            fecha: fecha.toISOString(),
            observaciones: observaciones.trim() || null
        };

        setLoading(true);
        try {
            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createVenta(data);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('ventas', data);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('ventas', data);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Venta guardada localmente. Se sincronizará cuando haya conexión.'
                        : 'Venta registrada correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar la venta');
            }
        } catch (error) {
            console.error('Error inesperado:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const calcularTotal = () => {
        const cant = parseInt(cantidad);
        const precio = parseFloat(precioUnitario);
        if (!isNaN(cant) && !isNaN(precio) && cant > 0 && precio > 0) {
            return (cant * precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        }
        return '$0';
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.title}>Registrar Venta</Text>

                <Text style={styles.label}>Fecha de la Venta *</Text>
                <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#2c3e50" style={{ marginRight: 10 }} />
                    <Text style={styles.datePickerText}>
                        {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={fecha}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                setFecha(selectedDate);
                            }
                        }}
                        maximumDate={new Date()}
                    />
                )}

                <Text style={styles.label}>Lote *</Text>
                <LoteSelector
                    onSelect={(lote) => {
                        setLoteId(lote.id);
                        setLoteNombre(lote.nombre);
                        setLoteTipo(lote.tipo_ave);
                        if (lote.tipo_ave === 'PONEDORA') {
                            setTipoProducto('HUEVOS');
                        } else {
                            setTipoProducto('AVES');
                        }
                    }}
                    selectedLoteId={loteId}
                    tipoNegocio={tipoNegocio}
                />

                <Text style={styles.label}>¿Qué está vendiendo? *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipoProducto}
                        onValueChange={(itemValue) => setTipoProducto(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Aves (Disminuye población)" value="AVES" />
                        <Picker.Item label="Huevos (No afecta población)" value="HUEVOS" />
                    </Picker>
                </View>

                {tipoProducto === 'HUEVOS' && (
                    <>
                        <Text style={styles.label}>Tamaño del Huevo *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={tamañoHuevo}
                                onValueChange={(itemValue) => setTamañoHuevo(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Jumbo" value="JUMBO" />
                                <Picker.Item label="AAA" value="AAA" />
                                <Picker.Item label="AA" value="AA" />
                                <Picker.Item label="A" value="A" />
                                <Picker.Item label="B" value="B" />
                                <Picker.Item label="C" value="C" />
                            </Picker>
                        </View>
                    </>
                )}

                <Text style={styles.label}>
                    {tipoProducto === 'HUEVOS' ? 'Cantidad de Huevos *' : 'Cantidad de Aves *'}
                </Text>
                <TextInput
                    style={styles.input}
                    value={cantidad}
                    onChangeText={setCantidad}
                    placeholder={tipoProducto === 'HUEVOS' ? "Ej: 180" : "Ej: 50"}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Precio Unitario *</Text>
                <TextInput
                    style={styles.input}
                    value={precioUnitario}
                    onChangeText={setPrecioUnitario}
                    placeholder="Ej: 500"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                />

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total de la venta:</Text>
                    <Text style={styles.totalValue}>{calcularTotal()}</Text>
                </View>

                <Text style={styles.label}>Cliente *</Text>
                <TextInput
                    style={styles.input}
                    value={cliente}
                    onChangeText={setCliente}
                    placeholder="Nombre del cliente"
                    placeholderTextColor="#999"
                />

                <Text style={styles.label}>Forma de Pago *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formaPago}
                        onValueChange={(itemValue) => setFormaPago(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Contado (Efectivo)" value="CONTADO_EFECTIVO" />
                        <Picker.Item label="Contado (Transferencia)" value="CONTADO_TRANSFERENCIA" />
                        <Picker.Item label="Crédito" value="CREDITO" />
                    </Picker>
                </View>

                {formaPago === 'CREDITO' && (
                    <>
                        <Text style={styles.label}>Abono Inicial (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={abono}
                            onChangeText={setAbono}
                            placeholder="Ej: 50000"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </>
                )}

                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    placeholder="Detalles adicionales..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Registrar Venta</Text>
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
    },
    form: {
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495e',
        marginBottom: 5,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#2c3e50',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    datePickerText: {
        fontSize: 16,
        color: '#2c3e50',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        marginBottom: 8,
        overflow: 'hidden',
    },
    picker: {
        color: '#2c3e50',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    totalContainer: {
        backgroundColor: '#e8f5e9',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    totalLabel: {
        fontSize: 14,
        color: '#2c3e50',
        marginBottom: 5,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    button: {
        backgroundColor: '#e67e22',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonDisabled: {
        backgroundColor: '#f39c12',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});