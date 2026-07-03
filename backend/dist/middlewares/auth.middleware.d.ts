import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map