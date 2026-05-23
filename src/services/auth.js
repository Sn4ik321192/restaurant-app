const provider = import.meta.env.VITE_AUTH_PROVIDER || 'demo';
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isEmailAuthEnabled = provider === 'supabase' && Boolean(supabaseUrl && supabaseKey);
export const authMode = isEmailAuthEnabled ? 'supabase-email' : 'demo-code';

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
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.msg || payload?.message || text || 'Auth request failed');
    error.status = response.status;
    error.authCode = payload?.error_code || '';
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function sendEmailCode(email) {
  if (!isEmailAuthEnabled) {
    return null;
  }

  return authRequest('otp', {
    email,
    create_user: true,
  });
}

export async function verifyEmailCode(email, token) {
  if (!isEmailAuthEnabled) {
    return null;
  }

  return authRequest('verify', {
    email,
    token,
    type: 'email',
  });
}
