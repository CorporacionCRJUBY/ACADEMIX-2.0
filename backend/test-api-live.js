const BASE = 'http://localhost:5000/api';
let pass = 0, fail = 0;
const results = [];

function check(name, cond, detail) {
  if (cond) { pass++; results.push(`PASS: ${name}`); }
  else { fail++; results.push(`FAIL: ${name} — ${detail || ''}`); }
}

async function req(method, path, { cookie, body, headers: extra } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(extra || {}) };
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
  const parts = [];
  for (const sc of setCookies) {
    const nameVal = sc.split(';')[0];
    const [name] = nameVal.split('=');
    if (name === 'accessToken' || name === 'refreshToken') parts.push(nameVal);
  }
  return parts.join('; ');
}

(async () => {
  // ===== AUTH (cookie-based) =====
  const adminLogin = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'Academix2026!' } });
  check('login admin -> 200', adminLogin.status === 200 && adminLogin.json?.success === true, `status=${adminLogin.status}`);
  const adminCookie = cookieFrom(adminLogin.setCookies);
  check('login setea cookies httpOnly (access+refresh)', adminCookie.includes('accessToken=') && adminCookie.includes('refreshToken='), adminCookie.slice(0, 60));
  check('login no devuelve tokens en el body', !JSON.stringify(adminLogin.json).includes('accessToken"') || adminLogin.json?.data?.accessToken === undefined);
  check('respuesta login no incluye hash bcrypt', !JSON.stringify(adminLogin.json).includes('$2b$'));
  check('respuesta login no incluye stack', !JSON.stringify(adminLogin.json).includes('"stack"'));
  const rawSetCookie = adminLogin.setCookies.join(' ');
  check('cookie accessToken es httpOnly', rawSetCookie.includes('HttpOnly'), rawSetCookie.slice(0, 120));
  check('cookie accessToken es SameSite=Strict', /SameSite=Strict/i.test(rawSetCookie));

  const badLogin = await req('POST', '/auth/login', { body: { email: 'admin@academix.com', password: 'PasswordMal1!' } });
  check('login con contraseña mala -> 401', badLogin.status === 401, `status=${badLogin.status}`);
  check('error 401 no revela stack (dev mode check)', !(badLogin.json && JSON.stringify(badLogin.json).includes('"stack"')), JSON.stringify(badLogin.json || {}).slice(0, 140));
  check('error 401 no revela rutas internas', !(badLogin.json && JSON.stringify(badLogin.json).includes('C:\\')));

  const noToken = await req('GET', '/students');
  check('GET /students sin token -> 401', noToken.status === 401, `status=${noToken.status}`);

  const tampered = await req('GET', '/students', { cookie: 'accessToken=' + adminCookie.split('accessToken=')[1].split(';')[0].slice(0, -4) + 'AAAA' });
  check('cookie de token manipulado -> 401', tampered.status === 401, `status=${tampered.status}`);

  // ===== REFRESH =====
  const refreshCookie = adminLogin.setCookies.find(c => c.startsWith('refreshToken='));
  if (refreshCookie) {
    const refreshed = await req('POST', '/auth/refresh', { cookie: refreshCookie.split(';')[0] });
    check('POST /auth/refresh con cookie refresh -> 200', refreshed.status === 200, `status=${refreshed.status} ${JSON.stringify(refreshed.json).slice(0, 120)}`);
  } else {
    check('login setea cookie refreshToken', false, 'no hay cookie refreshToken');
  }

  const me = await req('GET', '/auth/me', { cookie: adminCookie });
  check('GET /auth/me -> 200', me.status === 200, `status=${me.status} ${JSON.stringify(me.json).slice(0, 100)}`);

  // ===== FUGA DE MATERIAL 2FA EN /users =====
  const usersList = await req('GET', '/users', { cookie: adminCookie });
  check('GET /users -> 200', usersList.status === 200, `status=${usersList.status}`);
  const usersBody = JSON.stringify(usersList.json || {});
  check('GET /users no fuga twofa_secret', !usersBody.includes('twofa_secret'), usersBody.slice(0, 150));
  check('GET /users no fuga twofa_backup_codes', !usersBody.includes('twofa_backup_codes'));
  check('GET /users no fuga password', !usersBody.includes('"password"'));
  const userOne = await req('GET', '/users/1', { cookie: adminCookie });
  check('GET /users/1 -> 200', userOne.status === 200, `status=${userOne.status}`);
  const userOneBody = JSON.stringify(userOne.json || {});
  check('GET /users/1 no fuga twofa_secret', !userOneBody.includes('twofa_secret'));
  check('GET /users/1 no fuga login_attempts', !userOneBody.includes('login_attempts'));

  // ===== LISTADOS DE TODOS LOS MÓDULOS (admin) — sin 500 =====
  const modules = [
    '/students', '/teachers', '/subjects', '/branches', '/academic-years', '/academic-periods',
    '/academic-history', '/assignments', '/attendance', '/grades', '/grade-change-requests',
    '/gpa', '/credits', '/scholarships', '/guardians', '/medical-records', '/previous-schools',
    '/documents', '/calendar', '/graduation', '/gransif', '/progress-reports', '/report-cards',
    '/transcripts', '/reports', '/audit', '/activity', '/roles', '/permissions', '/settings'
  ];
  for (const m of modules) {
    const r = await req('GET', m, { cookie: adminCookie });
    check(`GET ${m} -> 200 (sin 500)`, r.status === 200, `status=${r.status} ${JSON.stringify(r.json || {}).slice(0, 140)}`);
  }

  // ===== RBAC (teacher) =====
  const teacherLogin = await req('POST', '/auth/login', { body: { email: 'maria.gonzalez@academix.com', password: 'Academix2026!' } });
  check('login teacher -> 200', teacherLogin.status === 200, `status=${teacherLogin.status}`);
  const teacherCookie = cookieFrom(teacherLogin.setCookies);

  const tUsers = await req('GET', '/users', { cookie: teacherCookie });
  check('teacher GET /users -> 403', tUsers.status === 403, `status=${tUsers.status}`);
  const tCreate = await req('POST', '/users', { cookie: teacherCookie, body: { email: 'x@x.com', password: 'Xx1234567890!', full_name: 'X', role_id: 1 } });
  check('teacher POST /users -> 403', tCreate.status === 403, `status=${tCreate.status}`);
  const tStudents = await req('GET', '/students', { cookie: teacherCookie });
  check('teacher GET /students -> 200', tStudents.status === 200, `status=${tStudents.status}`);

  // ===== VALIDACIÓN DE ENTRADA =====
  const badId = await req('GET', '/students/abc', { cookie: adminCookie });
  check('GET /students/abc -> 400/404, no 500', badId.status === 400 || badId.status === 404, `status=${badId.status}`);
  const sqlProbe = await req('GET', "/students?page=1&limit=10&search=%27%20OR%20%271%27%3D%271", { cookie: adminCookie });
  check('sondeo inyección SQL en query -> no 500', sqlProbe.status !== 500, `status=${sqlProbe.status}`);

  // ===== POLÍTICA DE CONTRASEÑAS EN CREACIÓN =====
  const weakUser = await req('POST', '/users', {
    cookie: adminCookie,
    body: { email: 'debil@academix.com', password: 'debil', full_name: 'Débil Test', role_id: 3, branch_id: 1 }
  });
  check('crear usuario con contraseña débil -> 4xx', weakUser.status >= 400 && weakUser.status < 500, `status=${weakUser.status} ${JSON.stringify(weakUser.json).slice(0, 120)}`);

  console.log(results.join('\n'));
  console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
  process.exit(0);
})().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(2); });
