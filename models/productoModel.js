import pool from '../config/db.js';

export async function obtenerProductos() {
  const [rows] = await pool.query('SELECT * FROM productos');
  return rows;
}

export async function obtenerProductoPorId(id) {
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  return rows[0];
}

export async function crearProducto({ nombre, precio }) {
  const [result] = await pool.query(
    'INSERT INTO productos (nombre, precio) VALUES (?, ?)',
    [nombre, precio]
  );
  return { id: result.insertId, nombre, precio };
}

export async function actualizarProducto(id, { nombre, precio }) {
  await pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [nombre, precio, id]);
  return { id, nombre, precio };
}

export async function eliminarProducto(id) {
  await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  return { mensaje: 'Producto eliminado' };
}
