"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
exports.updateAvatar = updateAvatar;
exports.deleteAvatar = deleteAvatar;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.logout = logout;
const bcrypt_1 = __importDefault(require("bcrypt"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const USER_SELECT = { id: true, name: true, email: true, role: true, avatarPath: true, createdAt: true, updatedAt: true };
function deleteAvatarFile(avatarPath) {
    const file = path_1.default.resolve(UPLOAD_DIR, avatarPath);
    if (file.startsWith(path_1.default.resolve(UPLOAD_DIR)) && fs_1.default.existsSync(file)) {
        try {
            fs_1.default.unlinkSync(file);
        }
        catch { /* le fichier peut être verrouillé, on ne bloque pas la requête */ }
    }
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: 'Email et mot de passe requis.' });
        return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ message: 'Identifiants incorrects.' });
        return;
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid) {
        res.status(401).json({ message: 'Identifiants incorrects.' });
        return;
    }
    const token = (0, jwt_1.signToken)({ id: user.id, role: user.role });
    res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}
async function me(req, res) {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: USER_SELECT,
    });
    if (!user) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    res.json(user);
}
async function updateAvatar(req, res) {
    if (!req.file) {
        res.status(400).json({ message: 'Aucune image reçue.' });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        deleteAvatarFile(path_1.default.join('avatars', req.file.filename));
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    if (user.avatarPath)
        deleteAvatarFile(user.avatarPath);
    const avatarPath = `avatars/${req.file.filename}`;
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { avatarPath },
        select: USER_SELECT,
    });
    res.json(updated);
}
async function deleteAvatar(req, res) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    if (user.avatarPath)
        deleteAvatarFile(user.avatarPath);
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { avatarPath: null },
        select: USER_SELECT,
    });
    res.json(updated);
}
async function updateProfile(req, res) {
    const { name, email } = req.body;
    if (!name?.trim() || !email?.trim()) {
        res.status(400).json({ message: 'Nom et email requis.' });
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ message: 'Adresse email invalide.' });
        return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.id) {
        res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
        return;
    }
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name: name.trim(), email: email.trim() },
        select: USER_SELECT,
    });
    res.json(user);
}
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return;
    }
    const valid = await bcrypt_1.default.compare(currentPassword, user.password);
    if (!valid) {
        // 400 et non 401 : l'intercepteur axios du front déconnecte sur 401
        res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
        return;
    }
    const hashed = await bcrypt_1.default.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Mot de passe modifié avec succès.' });
}
function logout(_req, res) {
    res.json({ message: 'Déconnexion réussie.' });
}
//# sourceMappingURL=auth.controller.js.map