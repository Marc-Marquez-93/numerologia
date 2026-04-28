import { expect } from 'chai';
import { useFormatLectura } from '../src/composables/useFormatLectura.js';

describe('Pruebas Unitarias - Lógica de Numerología (Frontend)', () => {
  const { formatearTextoIA } = useFormatLectura();

  it('Debería retornar un string vacío si no se recibe texto', () => {
    const resultado = formatearTextoIA(null);
    expect(resultado).to.equal('');
  });

  it('Debería convertir títulos ### en spans con clase lectura-titulo', () => {
    const input = '### Título de prueba';
    const resultado = formatearTextoIA(input);
    expect(resultado).to.contain('<span class="lectura-titulo">Título de prueba</span>');
  });

  it('Debería convertir negrillas ** en strong con clase lectura-destacado y em', () => {
    const input = 'Texto con **palabra clave** importante';
    const resultado = formatearTextoIA(input);
    expect(resultado).to.contain('<strong class="lectura-destacado"><em>palabra clave</em></strong>');
  });

  it('Debería manejar múltiples formatos en el mismo texto', () => {
    const input = '### Título\nEste es un **mensaje** místico.';
    const resultado = formatearTextoIA(input);
    expect(resultado).to.contain('<span class="lectura-titulo">Título</span>');
    expect(resultado).to.contain('<strong class="lectura-destacado"><em>mensaje</em></strong>');
  });
});