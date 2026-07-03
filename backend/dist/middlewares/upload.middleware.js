"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCandidature = exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const tmpStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const tmpDir = path_1.default.join(UPLOAD_DIR, 'candidatures', 'tmp');
        fs_1.default.mkdirSync(tmpDir, { recursive: true });
        cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const cvFilter = (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path_1.default.extname(file.originalname).toLowerCase()))
        cb(null, true);
    else
        cb(new Error('Le CV doit être un fichier PDF, DOC ou DOCX.'));
};
const photoFilter = (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path_1.default.extname(file.originalname).toLowerCase()))
        cb(null, true);
    else
        cb(new Error('La photo doit être un fichier JPG, PNG ou WEBP.'));
};
const cniFilter = (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    if (allowed.includes(path_1.default.extname(file.originalname).toLowerCase()))
        cb(null, true);
    else
        cb(new Error('La pièce d\'identité doit être JPG, PNG ou PDF.'));
};
const MAX_CV_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_CNI_SIZE = 5 * 1024 * 1024;
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(UPLOAD_DIR, 'avatars');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `avatar-${unique}${path_1.default.extname(file.originalname).toLowerCase()}`);
    },
});
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    limits: { fileSize: MAX_PHOTO_SIZE },
    fileFilter: photoFilter,
}).single('avatar');
exports.uploadCandidature = (0, multer_1.default)({
    storage: tmpStorage,
    limits: { fileSize: Math.max(MAX_CV_SIZE, MAX_CNI_SIZE) },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'cv')
            cvFilter(req, file, cb);
        else if (file.fieldname === 'photo')
            photoFilter(req, file, cb);
        else if (file.fieldname === 'cniRecto' || file.fieldname === 'cniVerso')
            cniFilter(req, file, cb);
        else
            cb(null, false);
    },
}).fields([
    { name: 'cv', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'cniRecto', maxCount: 1 },
    { name: 'cniVerso', maxCount: 1 },
]);
//# sourceMappingURL=upload.middleware.js.map