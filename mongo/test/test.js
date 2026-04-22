import { expect } from 'chai';
import { rolValido } from '../helpers/usuario.js';

describe('Pruebas Unitarias - Helpers de Usuario', () => {
  it('Debería retornar "admin" cuando el rol es 0', () => {
    const resultado = rolValido(0);
    expect(resultado).to.equal('admin');
  });

  it('Debería retornar "user" cuando el rol es distinto de 0', () => {
    const resultado = rolValido(1);
    expect(resultado).to.equal('user');
  });
});