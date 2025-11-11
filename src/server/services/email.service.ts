interface SendPasswordResetEmailParams {
  email: string;
  resetUrl: string;
  userName?: string;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams): Promise<void> {
  console.log('📧 [EMAIL-SERVICE] sendPasswordResetEmail called');
  console.log('📧 [EMAIL-SERVICE] Parameters:', { email, resetUrl, userName });
  
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  console.log('📧 [EMAIL-SERVICE] EmailJS config check:', {
    serviceId: !!serviceId,
    templateId: !!templateId,
    publicKey: !!publicKey,
    privateKey: !!privateKey,
  });
  
  if (!serviceId || !templateId || !publicKey) {
    console.warn('⚠️  [EMAIL-SERVICE] EmailJS not configured. Missing:', {
      serviceId: !serviceId,
      templateId: !templateId,
      publicKey: !publicKey,
    });
    console.log('📧 [EMAIL-SERVICE] Password reset URL (for testing):', resetUrl);
    throw new Error('Email service not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY environment variables.');
  }

  console.log(`📧 [EMAIL-SERVICE] To email: ${email}`);
  console.log(`📧 [EMAIL-SERVICE] Reset URL: ${resetUrl}`);

  try {
    console.log('📧 [EMAIL-SERVICE] Calling EmailJS REST API...');
    
    // Template parameters that match your EmailJS template
    // Based on your template configuration:
    // - To Email field uses: {{user_email}}
    // - Content uses: {{user_name}} and {{reset_url}}
    // - From Name uses: {{name}} (optional)
    // - Reply To uses: {{email}} (optional)
    const templateParams = {
      user_email: email,        // Matches "To Email" field in template
      user_name: userName || 'there',  // Matches {{user_name}} in content
      reset_url: resetUrl,      // Matches {{reset_url}} in content
      name: userName || 'AI Course Generator',  // For "From Name" field
      email: email,             // For "Reply To" field
    };

    // Use EmailJS REST API directly (more reliable for server-side)
    const requestBody: any = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
    };

    // Add private key if available (recommended for server-side)
    if (privateKey) {
      requestBody.accessToken = privateKey;
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      console.error('❌ [EMAIL-SERVICE] EmailJS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseData,
      });
      
      // Provide helpful error message for 403 Forbidden
      if (response.status === 403 && responseData.includes('non-browser')) {
        const errorMsg = `EmailJS API error: Server-side API calls are disabled. 
        
To fix this:
1. Go to https://dashboard.emailjs.com/
2. Navigate to Account → Security
3. Enable "Allow EmailJS API for non-browser applications"
4. Save and try again

This setting allows your server to send emails via EmailJS API.`;
        throw new Error(errorMsg);
      }
      
      throw new Error(`EmailJS API error: ${response.status} ${response.statusText} - ${responseData}`);
    }
    
    console.log('✅ [EMAIL-SERVICE] Password reset email sent successfully!');
    console.log('📧 [EMAIL-SERVICE] Response status:', response.status);
    console.log('📧 [EMAIL-SERVICE] Response:', responseData);
  } catch (error: any) {
    console.error('❌ [EMAIL-SERVICE] Failed to send password reset email:');
    console.error('❌ [EMAIL-SERVICE] Error type:', error?.constructor?.name);
    console.error('❌ [EMAIL-SERVICE] Error message:', error?.message);
    
    if (error.stack) {
      console.error('❌ [EMAIL-SERVICE] Error stack:', error.stack);
    }
    
    // Throw a more descriptive error
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Failed to send password reset email: ${errorMessage}`);
  }
}
