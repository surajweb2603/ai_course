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
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  
  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Email service not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PUBLIC_KEY environment variables.');
  }

  // Template parameters that match your EmailJS template
  // IMPORTANT: Make sure your EmailJS template has:
  // - "To Email" field set to: {{user_email}}
  // - Content includes: {{user_name}} and {{reset_url}}
  // - "From Name" field can use: {{name}} (optional)
  // - "Reply To" field can use: {{email}} (optional)
  const templateParams = {
    user_email: email,        // Matches "To Email" field in template - REQUIRED
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
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
  
  if (!response.ok) {
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
      throw new Error(`EmailJS error: ${errorMessage}`);
    }
  } else if (typeof responseData === 'string') {
    // String response - check for error indicators
    if (responseData.toLowerCase().includes('error') || responseData.toLowerCase().includes('fail')) {
      throw new Error(`EmailJS error: ${responseData}`);
    }
  }
}
