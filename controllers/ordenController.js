import {
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  eliminarOrden
} from '../models/ordenModel.js';

export async function getOrdenes(req, res) {
  const ordenes = await obtenerOrdenes();
  res.json(ordenes);
}

export async function getOrden(req, res) {
  const orden = await obtenerOrdenPorId(req.params.id);
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(orden);
}

export async function postOrden(req, res) {
  const nueva = await crearOrden(req.body);
  res.status(201).json(nueva);
}

export async function deleteOrden(req, res) {
  const resultado = await eliminarOrden(req.params.id);
  res.json(resultado);
}
