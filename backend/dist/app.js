"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const candidature_routes_1 = __importDefault(require("./routes/candidature.routes"));
const demande_routes_1 = __importDefault(require("./routes/demande.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const temoignage_routes_1 = __importDefault(require("./routes/temoignage.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const placement_routes_1 = __importDefault(require("./routes/placement.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const reminders_1 = require("./cron/reminders");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin))
            callback(null, true);
        else
            callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/public', public_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/candidatures', candidature_routes_1.default);
app.use('/api/demandes', demande_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/temoignages', temoignage_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/placements', placement_routes_1.default);
app.use('/api/search', search_routes_1.default);
// Wildcard : les fichiers peuvent être dans des sous-dossiers (ex: candidatures/4/xxx.pdf)
app.get('/api/uploads/*', auth_middleware_1.authMiddleware, (req, res) => {
    const rel = req.params[0] ?? '';
    const uploadRoot = path_1.default.resolve(UPLOAD_DIR);
    const filePath = path_1.default.resolve(uploadRoot, rel);
    if (!filePath.startsWith(uploadRoot + path_1.default.sep)) {
        res.status(403).json({ message: 'Accès refusé.' });
        return;
    }
    if (!fs_1.default.existsSync(filePath) || !fs_1.default.statSync(filePath).isFile()) {
        res.status(404).json({ message: 'Fichier introuvable.' });
        return;
    }
    res.sendFile(filePath);
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Erreur serveur interne.' });
});
app.listen(PORT, () => {
    console.log(`🚀 Serveur Global Clean Tech démarré sur http://localhost:${PORT}`);
    (0, reminders_1.startCronJobs)();
});
exports.default = app;
//# sourceMappingURL=app.js.map