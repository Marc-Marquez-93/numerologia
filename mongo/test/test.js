import { expect } from 'chai';
import { login } from '../controllers/usuario.js';

describe('Pruebas de Usuario con Chai', () => {
  it('Debería fallar si el correo no está registrado', async () => {
  // 1. El "req" con un correo que no existe
  const req = {
    body: {
      email: 'no-existoo@correo.com',
      password: '123456password'
    }
  };

  // 2. El "res" simulado para capturar lo que responda el controlador
  const res = {
    statusCode: 0,
    message: '',
    status: function(code) {
      this.statusCode = code;
      return this; // Para poder encadenar .json()
    },
    json: function(data) {
      this.message = data.msg;
    }
  };

  // 3. Ejecutamos la función
  await login(req, res);

  // 4. ¡Aquí es donde usas a Chai!
});
});