"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login);
router.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.logout);
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.me);
router.patch('/me', auth_middleware_1.authMiddleware, auth_controller_1.updateProfile);
router.patch('/me/password', auth_middleware_1.authMiddleware, auth_controller_1.changePassword);
router.post('/me/avatar', auth_middleware_1.authMiddleware, upload_middleware_1.uploadAvatar, auth_controller_1.updateAvatar);
router.delete('/me/avatar', auth_middleware_1.authMiddleware, auth_controller_1.deleteAvatar);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map