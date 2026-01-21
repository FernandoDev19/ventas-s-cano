import api from '../config/api';
import { type User } from '../models/user.model';

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export const authService = {
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = (await api.post('/auth/signin', credentials));
    const { access_token } = response.data;
    
    // Guardar el token en localStorage
    localStorage.setItem('token', access_token);
    
    return { access_token };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export default authService;
