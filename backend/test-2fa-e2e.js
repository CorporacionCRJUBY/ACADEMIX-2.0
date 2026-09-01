// Prueba E2E del flujo 2FA completo contra el servidor vivo.
// Ejecutar con el servidor corriendo: node test-2fa-e2e.js
const twoFactor = require('./src/utils/twoFactor');

const BASE = 'http://localhost:5000/api';
let pass = 0, fail = 0;
const results = [];

function check(name, cond, detail) {
  if (cond) { pass++; results.push(`PASS: ${name}`); }
  else { fail++; results.push(`FAIL: ${name} — ${detail || ''}`); }
}

async function req(method, path, { cookie, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try { json = await res.json(); } catch { /* sin cuerpo */ }
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, json, setCookies };
}

function cookieFrom(setCookies) {
  return setCookies
    .map(sc => sc.split(';')[0])
    .filter(p => p.startsWith('accessToken=') || p.startsWith('refreshToken='))
    .join('; ');
}

(async () => {
  // 1. Login inicial (sin 2FA todavía)
  const login1 = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  check('login inicial -> 200', login1.status === 200, `status=${login1.status}`);
  const cookie = cookieFrom(login1.setCookies);

  // 2. Setup 2FA
  const setup = await req('POST', '/auth/2fa/setup', { cookie });
  check('2FA setup -> 200', setup.status === 200, `status=${setup.status} ${JSON.stringify(setup.json).slice(0, 120)}`);
  const secret = setup.json?.data?.secret;
  check('setup devuelve secreto base32', typeof secret === 'string' && secret.length > 0);
  check('setup devuelve QR data URL', String(setup.json?.data?.qrCodeDataUrl || '').startsWith('data:image/png'));

  // 3. Confirmar con código TOTP real calculado con el mismo util
  const code = twoFactor.generateTOTP(secret);
  const confirm = await req('POST', '/auth/2fa/confirm', { cookie, body: { code } });
  check('2FA confirm con TOTP válido -> 200', confirm.status === 200, `status=${confirm.status} ${JSON.stringify(confirm.json).slice(0, 120)}`);
  const backupCodes = confirm.json?.data?.backupCodes;
  check('confirm devuelve 10 códigos de respaldo', Array.isArray(backupCodes) && backupCodes.length === 10);

  // 4. Confirmación con código inválido ya no debe funcionar (no hay pendiente)
  const reconfirm = await req('POST', '/auth/2fa/setup', { cookie });
  check('segundo setup con 2FA activo -> 409', reconfirm.status === 409, `status=${reconfirm.status}`);

  // 5. Login ahora exige 2FA
  const login2 = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  check('login con 2FA activo -> 200 + twoFactorRequired', login2.status === 200 && login2.json?.data?.twoFactorRequired === true, JSON.stringify(login2.json).slice(0, 120));
  const challengeToken = login2.json?.data?.challengeToken;
  check('login devuelve challengeToken', typeof challengeToken === 'string' && challengeToken.length > 0);
  check('login con 2FA NO setea cookies de sesión todavía', !cookieFrom(login2.setCookies).includes('accessToken='));

  // 6. Verificar con código incorrecto -> 401
  const badVerify = await req('POST', '/auth/2fa/verify', { body: { challengeToken, code: '000000' } });
  check('2FA verify con código malo -> 401', badVerify.status === 401, `status=${badVerify.status}`);

  // 7. Verificar con TOTP correcto -> sesión
  const code2 = twoFactor.generateTOTP(secret);
  const goodVerify = await req('POST', '/auth/2fa/verify', { body: { challengeToken, code: code2 } });
  check('2FA verify con TOTP válido -> 200', goodVerify.status === 200, `status=${goodVerify.status} ${JSON.stringify(goodVerify.json).slice(0, 140)}`);
  const sessionCookie = cookieFrom(goodVerify.setCookies);
  check('verify setea cookies de sesión', sessionCookie.includes('accessToken=') && sessionCookie.includes('refreshToken='));

  // 8. El challenge es de un solo uso: reutilizarlo debe fallar
  const reuse = await req('POST', '/auth/2fa/verify', { body: { challengeToken, code: twoFactor.generateTOTP(secret) } });
  check('challenge reutilizado -> 401 (single-use)', reuse.status === 401, `status=${reuse.status} ${JSON.stringify(reuse.json).slice(0, 120)}`);

  // 9. La sesión obtenida funciona
  const me = await req('GET', '/auth/me', { cookie: sessionCookie });
  check('GET /auth/me con sesión 2FA -> 200', me.status === 200, `status=${me.status}`);

  // 10. Código de respaldo: nuevo login, verificar con backup code
  const login3 = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  const challenge3 = login3.json?.data?.challengeToken;
  const backupVerify = await req('POST', '/auth/2fa/verify', { body: { challengeToken: challenge3, code: backupCodes[0] } });
  check('2FA verify con código de respaldo -> 200', backupVerify.status === 200, `status=${backupVerify.status} ${JSON.stringify(backupVerify.json).slice(0, 120)}`);

  // 11. El mismo código de respaldo no sirve dos veces
  const login4 = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  const challenge4 = login4.json?.data?.challengeToken;
  const backupReuse = await req('POST', '/auth/2fa/verify', { body: { challengeToken: challenge4, code: backupCodes[0] } });
  check('código de respaldo reutilizado -> 401', backupReuse.status === 401, `status=${backupReuse.status}`);

  // 12. Desactivar 2FA (requiere contraseña) para dejar el estado inicial
  const disableCookie = cookieFrom(backupVerify.setCookies);
  const disable = await req('POST', '/auth/2fa/disable', { cookie: disableCookie, body: { password: 'Academix2026!' } });
  check('2FA disable con contraseña -> 200', disable.status === 200, `status=${disable.status} ${JSON.stringify(disable.json).slice(0, 120)}`);

  const loginFinal = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  check('tras disable, login directo funciona', loginFinal.status === 200 && loginFinal.json?.data?.twoFactorRequired === false);

  console.log(results.join('\n'));
  console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(2); });
