import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from '../models/productoModel.js';

export async function getProductos(req, res) {
  const productos = await obtenerProductos();
  res.json(productos);
}

export async function getProducto(req, res) {
  const producto = await obtenerProductoPorId(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
}

export async function postProducto(req, res) {
  const nuevo = await crearProducto(req.body);
  res.status(201).json(nuevo);
}

export async function putProducto(req, res) {
  const actualizado = await actualizarProducto(req.params.id, req.body);
  res.json(actualizado);
}

export async function deleteProducto(req, res) {
  const resultado = await eliminarProducto(req.params.id);
  res.json(resultado);
}
