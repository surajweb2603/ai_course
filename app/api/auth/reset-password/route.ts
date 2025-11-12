import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { hashPassword, verifyPassword } from '@/src/utils/hash';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  const { token, password } = await req.json();

  // Validate inputs
  if (!token || !password) {
    return NextResponse.json(
      { error: 'Token and password are required' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: new Date() }, // Token must not be expired
    provider: 'local',
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    );
  }

  // Check if new password is the same as current password
  if (user.passwordHash) {
    const isSamePassword = await verifyPassword(password, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password' },
        { status: 400 }
      );
    }
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update user password and clear reset token
  user.passwordHash = passwordHash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return NextResponse.json({
    message: 'Password has been reset successfully. You can now login with your new password.',
  });
});

