// ============================================================
// FAYL: server/middleware/adminAuth.js
// TƏSVİR: Admin route-larını qoruyur.
//         ADMIN_API_TOKEN konfiqurasiya edilməyibsə (və ya 24
//         simvoldan qısadırsa) bütün admin route-ları FAIL-CLOSED
//         qaydası ilə TAM bağlıdır (403) — "boş token = açıq qapı"
//         riski yoxdur.
// ============================================================

'use strict';

const config = require('../config/env');

function adminAuth(req, res, next) {
  if (!config.server.adminEnabled) {
    return res.status(403).json({ error: 'Admin panel deaktivdir (ADMIN_API_TOKEN konfiqurasiya edilməyib).' });
  }

  const provided = req.get('x-admin-token') || '';
  if (provided !== config.server.adminToken) {
    return res.status(401).json({ error: 'Yanlış admin tokeni.' });
  }

  return next();
}

module.exports = { adminAuth };
