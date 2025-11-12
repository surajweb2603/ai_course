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
  
  // Log partial values for debugging (without exposing full keys)
  if (serviceId) {
    console.log('📧 [EMAIL-SERVICE] Service ID:', serviceId.substring(0, 15) + '...');
  }
  if (templateId) {
    console.log('📧 [EMAIL-SERVICE] Template ID:', templateId.substring(0, 15) + '...');
  }
  if (publicKey) {
    console.log('📧 [EMAIL-SERVICE] Public Key:', publicKey.substring(0, 15) + '...');
  }
  if (privateKey) {
    console.log('📧 [EMAIL-SERVICE] Private Key:', privateKey.substring(0, 15) + '...');
  } else {
    console.warn('⚠️  [EMAIL-SERVICE] Private key not set - using public key only (less secure)');
  }
  
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
    // IMPORTANT: Make sure your EmailJS template has:
    // - "To Email" field set to: {{user_email}}
    // - Content includes: {{user_name}} and {{reset_url}}
    // - "From Name" field can use: {{name}} (optional)
    // - "Reply To" field can use: {{email}} (optional)
    //
    // If emails are not being sent despite 200 OK response:
    // 1. Check EmailJS Dashboard → Logs for detailed error messages
    // 2. Verify "To Email" field in template is set to {{user_email}}
    // 3. Verify email service (Gmail/Outlook) is properly connected
    // 4. Check spam/junk folder
    // 5. Verify account hasn't hit free tier limits (200 emails/month)
    const templateParams = {
      user_email: email,        // Matches "To Email" field in template - REQUIRED
      user_name: userName || 'there',  // Matches {{user_name}} in content
      reset_url: resetUrl,      // Matches {{reset_url}} in content
      name: userName || 'AI Course Generator',  // For "From Name" field
      email: email,             // For "Reply To" field
    };
    
    console.log('📧 [EMAIL-SERVICE] Template parameters:', {
      user_email: email,
      user_name: userName || 'there',
      reset_url: resetUrl.substring(0, 50) + '...',
      name: userName || 'AI Course Generator',
    });

    // Use EmailJS REST API directly (more reliable for server-side)
    const requestBody: any = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
    };

    // Add private key if available (recommended for server-side)
    // EmailJS accepts accessToken in request body OR Authorization header
    // We'll use request body method (more common)
    if (privateKey) {
      requestBody.accessToken = privateKey;
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Alternative: Some EmailJS configurations require Authorization header
    // Uncomment if accessToken in body doesn't work:
    // if (privateKey) {
    //   headers['Authorization'] = `Bearer ${privateKey}`;
    // }
    
    console.log('📧 [EMAIL-SERVICE] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('📧 [EMAIL-SERVICE] Request headers:', headers);
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    // Try to parse as JSON first, fallback to text
    let responseData: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('📧 [EMAIL-SERVICE] Response status:', response.status);
    console.log('📧 [EMAIL-SERVICE] Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📧 [EMAIL-SERVICE] Response data:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error('❌ [EMAIL-SERVICE] EmailJS API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseData,
      });
      
      // Provide helpful error message for 403 Forbidden
      if (response.status === 403) {
        const errorMsg = `EmailJS API error: Server-side API calls are disabled. 
        
To fix this:
1. Go to https://dashboard.emailjs.com/
2. Navigate to Account → Security
3. Enable "Allow EmailJS API for non-browser applications"
4. Save and try again

This setting allows your server to send emails via EmailJS API.`;
        throw new Error(errorMsg);
      }
      
      const errorMessage = typeof responseData === 'string' 
        ? responseData 
        : responseData?.message || responseData?.error || JSON.stringify(responseData);
      throw new Error(`EmailJS API error: ${response.status} ${response.statusText} - ${errorMessage}`);
    }
    
    // Check for errors in response even with 200 status
    // EmailJS sometimes returns 200 OK but includes error messages
    if (typeof responseData === 'object' && responseData !== null) {
      if (responseData.status === 'error' || responseData.error) {
        const errorMessage = responseData.text || responseData.message || responseData.error || JSON.stringify(responseData);
        console.error('❌ [EMAIL-SERVICE] EmailJS returned error in response:', errorMessage);
        throw new Error(`EmailJS error: ${errorMessage}`);
      }
      
      // Check for success indicators
      if (responseData.status === 'success' || responseData.text === 'OK') {
        console.log('✅ [EMAIL-SERVICE] Password reset email sent successfully!');
        console.log('📧 [EMAIL-SERVICE] EmailJS response:', responseData);
        console.log('📧 [EMAIL-SERVICE] NOTE: If email not received, check:');
        console.log('   1. EmailJS Dashboard → Logs for delivery status');
        console.log('   2. Spam/junk folder');
        console.log('   3. Email service connection in EmailJS dashboard');
        console.log('   4. Free tier limits (200 emails/month)');
      } else {
        // Log warning if response format is unexpected
        console.warn('⚠️  [EMAIL-SERVICE] Unexpected response format:', responseData);
        console.log('✅ [EMAIL-SERVICE] Assuming success (status 200)');
        console.log('📧 [EMAIL-SERVICE] IMPORTANT: Check EmailJS Dashboard → Logs to verify email was sent');
      }
    } else if (typeof responseData === 'string') {
      // String response - check for error indicators
      if (responseData.toLowerCase().includes('error') || responseData.toLowerCase().includes('fail')) {
        console.error('❌ [EMAIL-SERVICE] EmailJS returned error:', responseData);
        throw new Error(`EmailJS error: ${responseData}`);
      } else if (responseData === 'OK' || responseData.toLowerCase().includes('ok')) {
        console.log('✅ [EMAIL-SERVICE] Password reset email sent successfully!');
        console.log('📧 [EMAIL-SERVICE] NOTE: If email not received, check EmailJS Dashboard → Logs');
      } else {
        console.log('✅ [EMAIL-SERVICE] Password reset email sent (response:', responseData, ')');
        console.log('📧 [EMAIL-SERVICE] NOTE: If email not received, check EmailJS Dashboard → Logs');
      }
    } else {
      console.log('✅ [EMAIL-SERVICE] Password reset email sent successfully!');
    }
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
