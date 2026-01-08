import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import LoteSelector from '../components/LoteSelector';
import apiService from '../services/api-service';
import { Ionicons } from '@expo/vector-icons';

export default function PosturaScreen({ navigation }: any) {
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [desglose, setDesglose] = useState({
        jumbo: '',
        aaa: '',
        aa: '',
        a: '',
        b: '',
        c: '',
        sucios_rotos: ''
    });
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalHuevos, setTotalHuevos] = useState(0);

    useEffect(() => {
        const total = Object.values(desglose).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
        setTotalHuevos(total);
    }, [desglose]);

    const handleInputChange = (key: string, value: string) => {
        setDesglose(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!selectedLote) {
            Alert.alert('Error', 'Por favor seleccione un lote');
            return;
        }
        if (selectedLote.tipo_ave !== 'PONEDORA') {
            Alert.alert('Error', 'Este lote no es de tipo PONEDORA');
            return;
        }
        if (totalHuevos <= 0) {
            Alert.alert('Error', 'Por favor ingrese al menos una cantidad de huevos');
            return;
        }

        setLoading(true);
        try {
            const datos = {
                lote_id: selectedLote.id,
                fecha: new Date().toISOString(),
                mortalidad_dia: 0,
                alimento_consumido_kg: 0,
                huevos_totales: totalHuevos,
                desglose_huevos: {
                    jumbo: parseInt(desglose.jumbo) || 0,
                    aaa: parseInt(desglose.aaa) || 0,
                    aa: parseInt(desglose.aa) || 0,
                    a: parseInt(desglose.a) || 0,
                    b: parseInt(desglose.b) || 0,
                    c: parseInt(desglose.c) || 0,
                    sucios_rotos: parseInt(desglose.sucios_rotos) || 0
                },
                observaciones: observaciones
            };

            let response;
            const isOnline = apiService.getConnectionStatus();

            if (isOnline) {
                response = await apiService.createRegistroDiario(datos);
                if (!response.success && response.isNetworkError) {
                    await apiService.savePendingRecord('registros_diario', datos);
                    response = { success: true, offline: true } as any;
                }
            } else {
                await apiService.savePendingRecord('registros_diario', datos);
                response = { success: true, offline: true } as any;
            }

            if (response.success) {
                const isOffline = (response as any).offline;
                Alert.alert(
                    isOffline ? 'Guardado Local' : 'Éxito',
                    isOffline
                        ? 'Registro guardado localmente. Se sincronizará al recuperar conexión.'
                        : 'Registro de postura guardado correctamente'
                );
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo guardar el registro');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const renderEggInput = (label: string, key: string, color: string) => (
        <View style={styles.eggInputRow}>
            <View style={[styles.eggIcon, { backgroundColor: color }]}>
                <Text style={styles.eggIconText}>{label[0]}</Text>
            </View>
            <Text style={styles.eggLabel}>{label}</Text>
            <TextInput
                style={styles.eggInput}
                keyboardType="numeric"
                placeholder="0"
                value={(desglose as any)[key]}
                onChangeText={(val) => handleInputChange(key, val)}
            />
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Selección de Lote</Text>
                <LoteSelector onSelect={setSelectedLote} />

                <Text style={styles.sectionTitle}>Recolección por Tamaño</Text>
                <View style={styles.eggGrid}>
                    {renderEggInput('Jumbo', 'jumbo', '#e67e22')}
                    {renderEggInput('AAA', 'aaa', '#f1c40f')}
                    {renderEggInput('AA', 'aa', '#2ecc71')}
                    {renderEggInput('A', 'a', '#3498db')}
                    {renderEggInput('B', 'b', '#9b59b6')}
                    {renderEggInput('C', 'c', '#95a5a6')}
                    {renderEggInput('Sucios/Rotos', 'sucios_rotos', '#e74c3c')}
                </View>

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total Recolectado:</Text>
                    <Text style={styles.totalValue}>{totalHuevos} huevos</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Observaciones:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Detalles adicionales..."
                        value={observaciones}
                        onChangeText={setObservaciones}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Guardar Registro</Text>
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        marginTop: 10,
    },
    eggGrid: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    eggInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    eggIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    eggIconText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    eggLabel: {
        flex: 1,
        fontSize: 16,
        color: '#34495e',
    },
    eggInput: {
        width: 80,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 8,
        textAlign: 'center',
        fontSize: 16,
        color: '#2c3e50',
    },
    totalContainer: {
        backgroundColor: '#e8f5e9',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 5,
        borderLeftColor: '#27ae60',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#27ae60',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2c3e50',
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#f39c12',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
