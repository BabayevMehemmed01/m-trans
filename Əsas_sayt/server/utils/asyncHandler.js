// ============================================================
// FAYL: server/utils/asyncHandler.js
// TƏSVİR: async route handler-larda atılan xətanı avtomatik
//         `next(err)`-ə yönləndirir — hər controllerdə təkrar
//         try/catch yazılmasının qarşısını alır.
// ============================================================

'use strict';

/**
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
