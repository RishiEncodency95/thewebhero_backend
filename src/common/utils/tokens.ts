import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[]; // ["resource:action", ...] flattened for fast checks
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const generateRandomToken = (): { raw: string; hashed: string } => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
};

export const hashToken = (raw: string): string => {
  return crypto.createHash("sha256").update(raw).digest("hex");
};
