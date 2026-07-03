import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function createDemande(req: Request, res: Response): Promise<void>;
export declare function listDemandes(req: AuthRequest, res: Response): Promise<void>;
export declare function getDemande(req: AuthRequest, res: Response): Promise<void>;
export declare function updateDemande(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteDemande(req: AuthRequest, res: Response): Promise<void>;
export declare function exportDemandesCsv(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=demande.controller.d.ts.map