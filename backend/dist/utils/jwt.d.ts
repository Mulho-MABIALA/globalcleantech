export declare const signToken: (payload: {
    id: number;
    role: string;
}) => string;
export declare const verifyToken: (token: string) => {
    id: number;
    role: string;
    iat: number;
    exp: number;
};
//# sourceMappingURL=jwt.d.ts.map