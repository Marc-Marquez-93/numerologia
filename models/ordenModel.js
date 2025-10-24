import pool from '../config/db.js';

export async function obtenerOrdenes() {
  const [rows] = await pool.query(`
    SELECT o.id, u.nombre AS usuario, p.nombre AS producto, o.cantidad, o.fecha
    FROM ordenes o
    JOIN usuarios u ON o.usuario_id = u.id
    JOIN productos p ON o.producto_id = p.id
    ORDER BY o.fecha DESC
  `);
  return rows;
}

export async function obtenerOrdenPorId(id) {
  const [rows] = await pool.query(`
    SELECT o.id, u.nombre AS usuario, p.nombre AS producto, o.cantidad, o.fecha
    FROM ordenes o
    JOIN usuarios u ON o.usuario_id = u.id
    JOIN productos p ON o.producto_id = p.id
    WHERE o.id = ?
  `, [id]);
  return rows[0];
}

export async function crearOrden({ usuario_id, producto_id, cantidad }) {
  const [result] = await pool.query(
    'INSERT INTO ordenes (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
    [usuario_id, producto_id, cantidad]
  );
  return { id: result.insertId, usuario_id, producto_id, cantidad };
}

export async function eliminarOrden(id) {
  await pool.query('DELETE FROM ordenes WHERE id = ?', [id]);
  return { mensaje: 'Orden eliminada' };
}
