import { expect } from 'chai';
import { useFormatLectura } from '../src/composables/useFormatLectura.js';

describe('Pruebas Unitarias - Lógica de Numerología', () => {
  const { formatearTextoIA } = useFormatLectura();

  it('Debería retornar un string vacío si no se recibe texto', () => {
    const resultado = formatearTextoIA(null);
    expect(resultado).to.equal('');
  });
});