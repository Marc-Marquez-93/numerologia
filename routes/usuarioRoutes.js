import { Router } from 'express';
import {
  getUsuarios,
  getUsuario,
  postUsuario,
  putUsuario,
  deleteUsuario
} from '../controllers/usuarioController.js';
import {
  validarCreacionUsuario,
  validarActualizacionUsuario
} from '../validators/usuarioValidator.js';

const router = Router();

router.get('/', getUsuarios);
router.get('/:id', getUsuario);
router.post('/', validarCreacionUsuario, postUsuario);
router.put('/:id', validarActualizacionUsuario, putUsuario);
router.delete('/:id', deleteUsuario);

export default router;
