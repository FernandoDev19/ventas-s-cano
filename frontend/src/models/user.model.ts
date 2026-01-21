export interface User {
  _id?: string;
  username: string;
  email: string;
  password?: string; // Solo para creación/actualización, no se debe enviar en respuestas
}
