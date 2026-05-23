const provider = import.meta.env.VITE_AUTH_PROVIDER || 'demo';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSmsAuthEnabled = provider === 'supabase' && Boolean(supabaseUrl && supabaseKey);
export const authMode = isSmsAuthEnabled ? 'supabase-sms' : 'demo-code';

async function authRequest(path, body) {
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || 'SMS auth request failed');
  }

  return text ? JSON.parse(text) : null;
}

export async function sendSmsCode(phone) {
  if (!isSmsAuthEnabled) {
    return null;
  }

  return authRequest('otp', {
    phone,
    create_user: true,
  });
}

export async function verifySmsCode(phone, token) {
  if (!isSmsAuthEnabled) {
    return null;
  }

  return authRequest('verify', {
    phone,
    token,
    type: 'sms',
  });
}
