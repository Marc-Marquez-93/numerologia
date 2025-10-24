import { Router } from 'express';
import {
  getOrdenes,
  getOrden,
  postOrden,
  deleteOrden
} from '../controllers/ordenController.js';
import {
  validarCreacionOrden,
  validarEliminacionOrden
} from '../validators/ordenValidator.js';

const router = Router();

router.get('/', getOrdenes);
router.get('/:id', getOrden);
router.post('/', validarCreacionOrden, postOrden);
router.delete('/:id', validarEliminacionOrden, deleteOrden);

export default router;
