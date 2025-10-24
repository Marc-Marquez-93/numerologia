import { Router } from 'express';
import {
  getProductos,
  getProducto,
  postProducto,
  putProducto,
  deleteProducto
} from '../controllers/productoController.js';
import {
  validarCreacionProducto,
  validarActualizacionProducto
} from '../validators/productoValidator.js';

const router = Router();

router.get('/', getProductos);
router.get('/:id', getProducto);
router.post('/', validarCreacionProducto, postProducto);
router.put('/:id', validarActualizacionProducto, putProducto);
router.delete('/:id', deleteProducto);

export default router;
