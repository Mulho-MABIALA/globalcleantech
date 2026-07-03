import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

export const signToken = (payload: { id: number; role: string }) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as jwt.SignOptions['expiresIn'] })

export const verifyToken = (token: string) =>
  jwt.verify(token, SECRET) as { id: number; role: string; iat: number; exp: number }
