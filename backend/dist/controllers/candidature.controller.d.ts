import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function createCandidature(req: AuthRequest, res: Response): Promise<void>;
export declare function listCandidatures(req: AuthRequest, res: Response): Promise<void>;
export declare function getCandidature(req: AuthRequest, res: Response): Promise<void>;
export declare function updateCandidature(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteCandidature(req: AuthRequest, res: Response): Promise<void>;
export declare function exportCandidaturesCsv(req: AuthRequest, res: Response): Promise<void>;
export declare function serveUpload(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=candidature.controller.d.ts.map