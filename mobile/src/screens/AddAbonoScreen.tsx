import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api-service';

export default function AddAbonoScreen({ route, navigation }: any) {
    const { venta } = route.params;
    const [monto, setMonto] = useState('');
    const [loading, setLoading] = useState(false);

    const saldoPendiente = venta.total - (venta.abono || 0);

    const handleSave = async () => {
        const montoNum = parseFloat(monto);

        if (isNaN(montoNum) || montoNum <= 0) {
            Alert.alert('Error', 'Por favor ingresa un monto válido mayor a 0');
            return;
        }

        if (montoNum > saldoPendiente) {
            Alert.alert('Error', 'El abono no puede ser mayor al saldo pendiente');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.addAbono(venta.id, montoNum);
            if (response.success) {
                Alert.alert('Éxito', 'Abono registrado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo registrar el abono');
            }
        } catch (error) {
            console.error('Error registrando abono:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#2c3e50" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Registrar Abono</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Cliente:</Text>
                    <Text style={styles.infoValue}>{venta.cliente}</Text>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.infoLabel}>Total Venta:</Text>
                            <Text style={styles.infoValue}>{formatCurrency(venta.total)}</Text>
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Saldo Pendiente:</Text>
                            <Text style={[styles.infoValue, styles.saldoText]}>{formatCurrency(saldoPendiente)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Monto del Abono *</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.input}
                            value={monto}
                            onChangeText={setMonto}
                            placeholder="0"
                            keyboardType="numeric"
                            autoFocus
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
                            <>
                                <Ionicons name="save-outline" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Guardar Abono</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoLabel: {
        fontSize: 13,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saldoText: {
        color: '#e74c3c',
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495e',
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 25,
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2ecc71',
        marginRight: 5,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    button: {
        backgroundColor: '#2ecc71',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        gap: 10,
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
