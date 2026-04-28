import { expect } from 'chai';
import { rolValido, esFechaValida, validarPasswordConfirmacion } from '../helpers/usuario.js';

describe('Pruebas Unitarias - Helpers de Usuario', () => {
  
  describe('rolValido', () => {
    it('Debería retornar "user" cuando el rol es 0', () => {
      const resultado = rolValido(0);
      expect(resultado).to.equal('user');
    });

    it('Debería retornar "admin" cuando el rol es 1', () => {
      const resultado = rolValido(1);
      expect(resultado).to.equal('admin');
    });

    it('Debería lanzar un error si el rol no es 0 o 1', () => {
      expect(() => rolValido(5)).to.throw('Rol inválido');
    });
  });

  describe('esFechaValida', () => {
    it('Debería retornar true para una fecha pasada', () => {
      const resultado = esFechaValida('1990-01-01');
      expect(resultado).to.equal(true);
    });

    it('Debería lanzar un error para una fecha futura', () => {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const fechaFutura = manana.toISOString().split('T')[0];
      
      expect(() => esFechaValida(fechaFutura)).to.throw('La fecha no puede ser mayor a la actual');
    });
  });

  describe('validarPasswordConfirmacion', () => {
    it('Debería retornar true si las contraseñas coinciden', () => {
      const req = { body: { confirmarPassword: '123' } };
      const resultado = validarPasswordConfirmacion('123', { req });
      expect(resultado).to.equal(true);
    });

    it('Debería lanzar un error si las contraseñas no coinciden', () => {
      const req = { body: { confirmarPassword: '456' } };
      expect(() => validarPasswordConfirmacion('123', { req })).to.throw('Las contraseñas no coinciden, verifica nuevamente');
    });
  });

});