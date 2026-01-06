// Interfaces para comunicación con el backend
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

// Configuración de la API
// En producción, Firebase Hosting redirigirá /api al backend en Cloud Run
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://192.168.1.5:3000/api' 
  : '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  // Gestión de autenticación
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        this.token = data.token;
        this.saveToken(data.token);
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Error de autenticación' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    this.removeToken();
  }

  private saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
    console.log('ApiService: Loaded token from localStorage:', this.token ? 'Exists' : 'Null');
  }

  private removeToken(): void {
    localStorage.removeItem('auth_token');
    console.log('ApiService: Removed token from localStorage');
  }

  // Métodos HTTP con autenticación
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: data.message || `Error ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  }

  // Métodos para Lotes
  async getLotes(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/lotes');
  }

  async getLote(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/lotes/${id}`);
  }

  async createLote(lote: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/lotes', {
      method: 'POST',
      body: JSON.stringify(lote),
    });
  }

  async updateLote(id: string, lote: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/lotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(lote),
    });
  }

  async deleteLote(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/lotes/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Registros Diarios
  async createRegistroDiario(registro: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/registro-diario', {
      method: 'POST',
      body: JSON.stringify(registro),
    });
  }

  async getRegistrosDiariosPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/registro-diario/lote/${loteId}`);
  }

  async getKPIsLote(loteId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/registro-diario/kpi/${loteId}`);
  }

  // Métodos para Insumos
  async getInsumos(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/insumos');
  }

  async createInsumo(insumo: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/insumos', {
      method: 'POST',
      body: JSON.stringify(insumo),
    });
  }

  async updateInsumo(id: string, insumo: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/insumos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(insumo),
    });
  }

  async deleteInsumo(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/insumos/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Sanidad
  async getProgramasSanitarios(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/sanidad/programas');
  }

  async createProgramaSanitario(programa: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/sanidad/programas', {
      method: 'POST',
      body: JSON.stringify(programa),
    });
  }

  async getProgramasSanitariosPorLote(loteId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/sanidad/programas/lote/${loteId}`);
  }

  async createAplicacionSanitaria(aplicacion: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/sanidad/aplicaciones', {
      method: 'POST',
      body: JSON.stringify(aplicacion),
    });
  }

  async getCalendarioSanitario(loteId: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/sanidad/calendario/${loteId}`);
  }

  async getReporteSanidad(loteId: string, fechaInicio?: string, fechaFin?: string): Promise<ApiResponse<any>> {
    let url = `/sanidad/reporte/${loteId}`;
    const params = new URLSearchParams();
    
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.makeRequest(url);
  }

  // Métodos para Galpones
  async getGalpones(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/galpones');
  }

  async createGalpon(galpon: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/galpones', {
      method: 'POST',
      body: JSON.stringify(galpon),
    });
  }

  async updateGalpon(id: string, galpon: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/galpones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(galpon),
    });
  }

  async deleteGalpon(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/galpones/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Fincas
  async getFincas(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/fincas');
  }

  async createFinca(finca: any): Promise<ApiResponse<any>> {
    return this.makeRequest('/fincas', {
      method: 'POST',
      body: JSON.stringify(finca),
    });
  }

  async updateFinca(id: string, finca: any): Promise<ApiResponse<any>> {
    return this.makeRequest(`/fincas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(finca),
    });
  }

  async deleteFinca(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/fincas/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para Administración de Usuarios
  async getPendingUsers(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/users/pending');
  }

  async getAllUsers(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/users');
  }

  async approveUser(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectUser(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}/reject`, {
      method: 'PATCH',
    });
  }

  async toggleUserStatus(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async updateUserRole(id: string, role: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/users/${id}/delete`, {
      method: 'POST',
    });
  }

  // Utilidades
  getConnectionStatus(): boolean {
    return navigator.onLine;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) {
      console.log('ApiService: No token found for role extraction');
      return null;
    }
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('ApiService: Invalid JWT format');
        return null;
      }
      
      const base64Url = parts[1];
      // @ts-ignore - Weird build error with regex/split in this environment
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(base64);
      const jsonPayload = decodeURIComponent(decoded.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      console.log('ApiService: Decoded JWT Payload:', payload);
      return payload.role || null;
    } catch (error) {
      console.error('ApiService: Error decoding JWT:', error);
      return null;
    }
  }
}

export default new ApiService();
