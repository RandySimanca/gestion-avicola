import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import apiService from '../services/api-service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootDrawerParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootDrawerParamList, 'EditGalpon'>;

export default function EditGalponScreen({ route, navigation }: Props) {
    const { galponId } = route.params;
    const [nombre, setNombre] = useState('');
    const [tipoAve, setTipoAve] = useState<'ENGORDE' | 'PONEDORA'>('ENGORDE');
    const [capacidad, setCapacidad] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [galpon, setGalpon] = useState<any>(null);

    useEffect(() => {
        loadGalpon();
    }, []);

    const loadGalpon = async () => {
        try {
            const response = await apiService.getGalpon(galponId);
            if (response.success && response.data) {
                const data = response.data;
                setGalpon(data);
                setNombre(data.nombre);
                setTipoAve(data.tipo_ave_principal || 'ENGORDE');
                setCapacidad(data.capacidad_max?.toString() || '');
            } else {
                Alert.alert('Error', 'No se pudo cargar la información del galpón');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'Error al cargar el galpón');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!nombre || !capacidad) {
            Alert.alert('Error', 'Por favor completa los campos obligatorios');
            return;
        }

        setSaving(true);
        try {
            const data = {
                nombre,
                tipo_ave_principal: tipoAve,
                capacidad_max: parseInt(capacidad),
            };

            const response = await apiService.updateGalpon(galponId, data);
            if (response.success) {
                Alert.alert('Éxito', 'Galpón actualizado correctamente');
                navigation.goBack();
            } else {
                Alert.alert('Error', response.error || 'No se pudo actualizar el galpón');
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
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.headerTitle}>Editar Galpón</Text>

                <Text style={styles.label}>Nombre del Galpón *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: Galpón 1"
                    value={nombre}
                    onChangeText={setNombre}
                />

                <Text style={styles.label}>Tipo de Ave Principal *</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={tipoAve}
                        onValueChange={(itemValue) => setTipoAve(itemValue)}
                        style={styles.picker}
                        dropdownIconColor="#000"
                    >
                        <Picker.Item label="Engorde" value="ENGORDE" />
                        <Picker.Item label="Ponedora" value="PONEDORA" />
                    </Picker>
                </View>

                <Text style={styles.label}>Capacidad Máxima (Aves) *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={capacidad}
                    onChangeText={setCapacidad}
                />

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Guardar Cambios</Text>
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
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 12,
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
    submitButton: {
        backgroundColor: '#3498db',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    disabledButton: {
        backgroundColor: '#95a5a6',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
