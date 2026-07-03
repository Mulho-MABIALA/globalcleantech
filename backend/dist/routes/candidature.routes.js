"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidature_controller_1 = require("../controllers/candidature.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.post('/', upload_middleware_1.uploadCandidature, candidature_controller_1.createCandidature);
router.use(auth_middleware_1.authMiddleware);
router.get('/export/csv', candidature_controller_1.exportCandidaturesCsv);
router.get('/', candidature_controller_1.listCandidatures);
router.get('/:id', candidature_controller_1.getCandidature);
router.patch('/:id', candidature_controller_1.updateCandidature);
router.delete('/:id', candidature_controller_1.deleteCandidature);
router.get('/uploads/:folder/:filename', candidature_controller_1.serveUpload);
exports.default = router;
//# sourceMappingURL=candidature.routes.js.map