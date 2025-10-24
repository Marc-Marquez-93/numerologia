import pool from '../config/db.js';

export async function obtenerUsuarios() {
  const [rows] = await pool.query('SELECT * FROM usuarios');
  return rows;
}

export async function obtenerUsuarioPorId(id) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0];
}

export async function crearUsuario({ nombre, email }) {
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
    [nombre, email]
  );
  return { id: result.insertId, nombre, email };
}

export async function actualizarUsuario(id, { nombre, email }) {
  await pool.query('UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?', [nombre, email, id]);
  return { id, nombre, email };
}

export async function eliminarUsuario(id) {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return { mensaje: 'Usuario eliminado' };
}
