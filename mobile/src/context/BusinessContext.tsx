import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipoNegocio } from '../types/business';
import apiService from '../services/api-service';


interface BusinessContextData {
  tipoNegocio: TipoNegocio;
  setTipoNegocio: (tipo: TipoNegocio) => Promise<void>;
  loading: boolean;
}

const BusinessContext = createContext<BusinessContextData>({} as BusinessContextData);

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const [tipoNegocio, setTipoNegocioState] = useState<TipoNegocio>(TipoNegocio.PONEDORAS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedBusiness();
  }, []);

  const loadSavedBusiness = async () => {
    try {
      const saved = await AsyncStorage.getItem('selected_business');
      if (saved) {
        setTipoNegocioState(saved as TipoNegocio);
        apiService.setTipoNegocio(saved as TipoNegocio);
      } else {
        apiService.setTipoNegocio(TipoNegocio.PONEDORAS);
      }
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  const setTipoNegocio = async (tipo: TipoNegocio) => {
    try {
      await AsyncStorage.setItem('selected_business', tipo);
      setTipoNegocioState(tipo);
      apiService.setTipoNegocio(tipo);
    } catch (error) {
      console.error('Error saving business:', error);
    }
  };

  return (
    <BusinessContext.Provider value={{ tipoNegocio, setTipoNegocio, loading }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness debe usarse dentro de BusinessProvider');
  }
  return context;
};
