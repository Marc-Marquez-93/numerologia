import { body, param } from 'express-validator';
import { validarCampos } from './validateResults.js';

export const validarCreacionProducto = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('precio').isFloat({ gt: 0 }).withMessage('El precio debe ser mayor que 0'),
  validarCampos
];

export const validarActualizacionProducto = [
  param('id').isInt().withMessage('El ID debe ser numérico'),
  body('nombre').optional().isLength({ min: 3 }),
  body('precio').optional().isFloat({ gt: 0 }),
  validarCampos
];
