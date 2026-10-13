import { User } from "../users/user.model";
import { IRole } from "../roles/role.model";
import { ApiError } from "../../common/utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} from "../../common/utils/tokens";
import { sendEmail } from "../../common/utils/sendEmail";
import { env } from "../../config/env";
import { LoginInput } from "./auth.validation";

const buildTokens = async (userId: string) => {
  const user = await User.findById(userId).populate<{ role: IRole }>("role");
  if (!user) throw ApiError.unauthorized("User no longer exists");
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated");

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions,
  });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });

  return { user, accessToken, refreshToken };
};

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) throw ApiError.unauthorized("Invalid email or password");
    if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

    user.lastLoginAt = new Date();
    await user.save();

    // buildTokens returns the user with its role populated, which the login
    // response needs for role name + permissions.
    const { accessToken, refreshToken, user: withRole } = await buildTokens(user.id);
    return { accessToken, refreshToken, user: withRole! };
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) throw ApiError.unauthorized("Refresh token missing");

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Refresh token invalid or expired");
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized("Refresh token has been revoked");
    }

    return buildTokens(user.id);
  },

  async logout(userId: string): Promise<void> {
    // Bumping tokenVersion invalidates every previously issued refresh token.
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Don't reveal whether the email exists - always respond success upstream.
    if (!user) return;

    const { raw, hashed } = generateRandomToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.ADMIN_URL}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your TheWebHero admin password",
      html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`,
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashed = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) throw ApiError.badRequest("Reset token is invalid or has expired");

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion += 1; // invalidate all existing sessions
    await user.save();
  },
};
