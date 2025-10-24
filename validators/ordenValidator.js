import { body, param } from 'express-validator';
import { validarCampos } from './validateResults.js';

export const validarCreacionOrden = [
  body('usuario_id').isInt().withMessage('El ID del usuario debe ser un número'),
  body('producto_id').isInt().withMessage('El ID del producto debe ser un número'),
  body('cantidad').isInt({ gt: 0 }).withMessage('La cantidad debe ser un número positivo'),
  validarCampos
];

export const validarEliminacionOrden = [
  param('id').isInt().withMessage('El ID debe ser numérico'),
  validarCampos
];
