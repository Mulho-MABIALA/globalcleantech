import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function login(req: Request, res: Response): Promise<void>;
export declare function me(req: AuthRequest, res: Response): Promise<void>;
export declare function updateAvatar(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteAvatar(req: AuthRequest, res: Response): Promise<void>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<void>;
export declare function changePassword(req: AuthRequest, res: Response): Promise<void>;
export declare function logout(_req: Request, res: Response): void;
//# sourceMappingURL=auth.controller.d.ts.map