import { body, param } from 'express-validator';
import { validarCampos } from './validateResults.js';

export const validarCreacionUsuario = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

  body('email')
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe ser un email válido'),

  validarCampos // <-- aplica el middleware genérico
];

export const validarActualizacionUsuario = [
  param('id').isInt().withMessage('El ID debe ser un número'),

  body('nombre')
    .optional()
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
 
  body('email')
    .optional()
    .isEmail().withMessage('Debe ser un email válido'),

  validarCampos
];
