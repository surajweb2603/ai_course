import { NextRequest, NextResponse } from 'next/server';
import { publicHandler } from '@/src/server/http/nextAdapter';
import User from '@/src/models/User';
import { nanoid } from 'nanoid';
import { sendPasswordResetEmail } from '@/src/server/services/email.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = publicHandler(async (req: NextRequest) => {
  console.log('🔵 [FORGOT-PASSWORD] Request received');
  
  const { email } = await req.json();
  console.log('🔵 [FORGOT-PASSWORD] Email received:', email);

  // Validate input
  if (!email) {
    console.log('❌ [FORGOT-PASSWORD] No email provided');
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  console.log('🔵 [FORGOT-PASSWORD] Searching for user with email:', email.toLowerCase());
  
  // First, check if user exists at all (any provider)
  const anyUser = await User.findOne({
    email: email.toLowerCase(),
  });

  console.log('🔵 [FORGOT-PASSWORD] User exists (any provider):', anyUser ? 'YES' : 'NO');
  if (anyUser) {
    console.log('🔵 [FORGOT-PASSWORD] User provider:', anyUser.provider);
  }

  // Find user with local provider (only local users can reset password)
  const user = await User.findOne({
    email: email.toLowerCase(),
    provider: 'local',
  });

  console.log('🔵 [FORGOT-PASSWORD] User found (local provider):', user ? 'YES' : 'NO');
  if (user) {
    console.log('🔵 [FORGOT-PASSWORD] User details:', {
      id: user._id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
  } else if (anyUser && anyUser.provider === 'google') {
    console.log('⚠️  [FORGOT-PASSWORD] User exists but uses Google OAuth - password reset not applicable');
  }

  // Always return success message to prevent email enumeration
  // But only actually send email if user exists
  if (user) {
    console.log('🔵 [FORGOT-PASSWORD] User exists, generating reset token...');
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
    console.log('🔵 [FORGOT-PASSWORD] Reset URL generated:', resetUrl);

    // Send password reset email
    console.log('🔵 [FORGOT-PASSWORD] Attempting to send email...');
    
    try {
      console.log('🔵 [FORGOT-PASSWORD] Calling sendPasswordResetEmail function...');
      await sendPasswordResetEmail({
        email: user.email,
        resetUrl,
        userName: user.name,
      });
      console.log(`✅ [FORGOT-PASSWORD] Password reset email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error('❌ [FORGOT-PASSWORD] Failed to send password reset email:');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Don't fail the request if email fails - still return success to prevent enumeration
      // The reset token is still saved, so user can request again if needed
      // In development, log the URL for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== PASSWORD RESET LINK (DEV ONLY - Email failed) ===');
        console.log('Reset URL:', resetUrl);
        console.log('User email:', user.email);
        console.log('==================================================\n');
      }
    }
  } else {
    if (anyUser && anyUser.provider === 'google') {
      console.log('⚠️  [FORGOT-PASSWORD] User uses Google OAuth - cannot reset password');
      // Still return generic message to prevent enumeration
      // But we know internally this is a Google user
    } else {
      console.log('🔵 [FORGOT-PASSWORD] User not found in database');
    }
  }

  // Always return success message to prevent email enumeration
  console.log('🔵 [FORGOT-PASSWORD] Returning success response');
  return NextResponse.json({
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

