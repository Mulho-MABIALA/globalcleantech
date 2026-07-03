"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const demande_controller_1 = require("../controllers/demande.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', demande_controller_1.createDemande);
router.use(auth_middleware_1.authMiddleware);
router.get('/export/csv', demande_controller_1.exportDemandesCsv);
router.get('/', demande_controller_1.listDemandes);
router.get('/:id', demande_controller_1.getDemande);
router.patch('/:id', demande_controller_1.updateDemande);
router.delete('/:id', demande_controller_1.deleteDemande);
exports.default = router;
//# sourceMappingURL=demande.routes.js.map