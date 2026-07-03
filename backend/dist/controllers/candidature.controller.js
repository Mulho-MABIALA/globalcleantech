"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidature = createCandidature;
exports.listCandidatures = listCandidatures;
exports.getCandidature = getCandidature;
exports.updateCandidature = updateCandidature;
exports.deleteCandidature = deleteCandidature;
exports.exportCandidaturesCsv = exportCandidaturesCsv;
exports.serveUpload = serveUpload;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const candidature_schema_1 = require("../schemas/candidature.schema");
const mail_service_1 = require("../services/mail.service");
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
async function createCandidature(req, res) {
    const parsed = candidature_schema_1.CandidatureSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({
            message: 'Données invalides.',
            errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
    }
    const files = req.files;
    const candidature = await prisma.candidature.create({
        data: {
            nomComplet: parsed.data.nomComplet,
            dateNaissance: new Date(parsed.data.dateNaissance),
            telephone: parsed.data.telephone,
            email: parsed.data.email || null,
            ville: parsed.data.ville,
            posteSouhaite: parsed.data.posteSouhaite,
            experience: parsed.data.experience,
            description: parsed.data.description || null,
            disponibilite: parsed.data.disponibilite,
            dateDisponibilite: parsed.data.dateDisponibilite ? new Date(parsed.data.dateDisponibilite) : null,
        },
    });
    let cvPath = null;
    let photoPath = null;
    let cniRectoPath = null;
    let cniVersoPath = null;
    if (files) {
        const destDir = path_1.default.join(UPLOAD_DIR, 'candidatures', String(candidature.id));
        fs_1.default.mkdirSync(destDir, { recursive: true });
        const saveFile = (f) => {
            const dest = path_1.default.join(destDir, f.filename);
            fs_1.default.renameSync(f.path, dest);
            return path_1.default.join('candidatures', String(candidature.id), f.filename);
        };
        if (files.cv?.[0])
            cvPath = saveFile(files.cv[0]);
        if (files.photo?.[0])
            photoPath = saveFile(files.photo[0]);
        if (files.cniRecto?.[0])
            cniRectoPath = saveFile(files.cniRecto[0]);
        if (files.cniVerso?.[0])
            cniVersoPath = saveFile(files.cniVerso[0]);
        if (cvPath || photoPath || cniRectoPath || cniVersoPath) {
            await prisma.candidature.update({
                where: { id: candidature.id },
                data: { cvPath, photoPath, cniRectoPath, cniVersoPath },
            });
        }
    }
    try {
        await (0, mail_service_1.sendCandidatureAdminMail)({
            id: candidature.id,
            nomComplet: candidature.nomComplet,
            telephone: candidature.telephone,
            email: candidature.email,
            ville: candidature.ville,
            posteSouhaite: candidature.posteSouhaite,
            experience: candidature.experience,
        });
    }
    catch (err) {
        console.error('Email admin candidature non envoyé :', err);
    }
    res.status(201).json({ ...candidature, cvPath, photoPath, cniRectoPath, cniVersoPath });
}
async function listCandidatures(req, res) {
    const { statut, poste, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const where = {};
    if (statut)
        where.statut = statut;
    if (poste)
        where.posteSouhaite = poste;
    if (search) {
        where.OR = [
            { nomComplet: { contains: search, mode: 'insensitive' } },
            { ville: { contains: search, mode: 'insensitive' } },
            { telephone: { contains: search } },
        ];
    }
    const [total, items] = await Promise.all([
        prisma.candidature.count({ where }),
        prisma.candidature.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    res.json({
        data: items,
        meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
}
async function getCandidature(req, res) {
    const id = parseInt(req.params.id);
    const candidature = await prisma.candidature.findUnique({ where: { id } });
    if (!candidature) {
        res.status(404).json({ message: 'Candidature introuvable.' });
        return;
    }
    res.json(candidature);
}
async function updateCandidature(req, res) {
    const id = parseInt(req.params.id);
    const parsed = candidature_schema_1.UpdateCandidatureSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(422).json({ message: 'Données invalides.', errors: parsed.error.errors });
        return;
    }
    const prev = await prisma.candidature.findUnique({ where: { id } });
    const updated = await prisma.candidature.update({ where: { id }, data: parsed.data });
    // Notify candidate by email when status changes
    if (parsed.data.statut && prev && parsed.data.statut !== prev.statut && updated.email) {
        const postes = {
            femme_menage: 'Femme de ménage', nounou: 'Nounou', cuisinier: 'Cuisinier(ère)',
            chauffeur: 'Chauffeur', gardien: 'Gardien', majordome: 'Majordome', autre: 'Autre',
        };
        (0, mail_service_1.sendStatutUpdateMail)({
            email: updated.email,
            nom: updated.nomComplet,
            statut: updated.statut,
            poste: postes[updated.posteSouhaite] ?? updated.posteSouhaite,
            id: updated.id,
        }).catch(() => { });
    }
    res.json(updated);
}
async function deleteCandidature(req, res) {
    const id = parseInt(req.params.id);
    const candidature = await prisma.candidature.findUnique({ where: { id } });
    if (!candidature) {
        res.status(404).json({ message: 'Candidature introuvable.' });
        return;
    }
    const dir = path_1.default.join(UPLOAD_DIR, 'candidatures', String(id));
    if (fs_1.default.existsSync(dir))
        fs_1.default.rmSync(dir, { recursive: true });
    await prisma.candidature.delete({ where: { id } });
    res.status(204).send();
}
async function exportCandidaturesCsv(req, res) {
    const candidatures = await prisma.candidature.findMany({ orderBy: { createdAt: 'desc' } });
    const headers = [
        'ID', 'Nom complet', 'Date naissance', 'Téléphone', 'Email',
        'Ville', 'Poste souhaité', 'Expérience', 'Disponibilité', 'Statut', 'Date de dépôt',
    ];
    const rows = candidatures.map((c) => [
        c.id,
        c.nomComplet,
        c.dateNaissance.toISOString().split('T')[0],
        c.telephone,
        c.email || '',
        c.ville,
        c.posteSouhaite,
        c.experience,
        c.disponibilite,
        c.statut,
        c.createdAt.toISOString(),
    ]);
    const csv = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="candidatures.csv"');
    res.send('﻿' + csv);
}
async function serveUpload(req, res) {
    const { folder, filename } = req.params;
    const filePath = path_1.default.resolve(UPLOAD_DIR, folder, filename);
    if (!filePath.startsWith(path_1.default.resolve(UPLOAD_DIR))) {
        res.status(403).json({ message: 'Accès refusé.' });
        return;
    }
    if (!fs_1.default.existsSync(filePath)) {
        res.status(404).json({ message: 'Fichier introuvable.' });
        return;
    }
    res.sendFile(filePath);
}
//# sourceMappingURL=candidature.controller.js.map