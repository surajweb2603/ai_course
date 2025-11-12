import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { nanoid } from 'nanoid';
import { sendPasswordResetEmail } from '@/src/server/services/email.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  const { email } = await req.json();

  // Validate input
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }
  
  // First, check if user exists at all (any provider)
  const anyUser = await User.findOne({
    email: email.toLowerCase(),
  });

  // Find user with local provider (only local users can reset password)
  const user = await User.findOne({
    email: email.toLowerCase(),
    provider: 'local',
  });

  // Always return success message to prevent email enumeration
  // But only actually send email if user exists
  if (user) {
    // Generate reset token
    const resetToken = nanoid(32);
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // Token expires in 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    // Generate reset URL
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
        userName: user.name,
      });
    } catch (error: any) {
      // Don't fail the request if email fails - still return success to prevent enumeration
      // The reset token is still saved, so user can request again if needed
    }
  }

  // Always return success message to prevent email enumeration
  console.log('🔵 [FORGOT-PASSWORD] Returning success response');
  return NextResponse.json({
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

