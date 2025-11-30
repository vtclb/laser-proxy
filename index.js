// laser-proxy.vartaclub.workers.dev — FIXED backend (no env needed)
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ---- CONFIG: жорстко вшитий GAS /exec ----
    const BACKEND = 'https://script.google.com/macros/s/AKfycbwHfFXlLUodqMVpv6NJnR1yYwYwm7_MG9gwJYZlALcoqp8ZICcQar_aPwDil7g0R7rd5A/exec';

    // ---- CORS (віддзеркалюємо Origin) ----
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'Content-Type, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    // ---- OPTIONS (preflight) ----
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // ---- HEALTH ----
    if (request.method === 'GET' && url.pathname === '/ping') {
      return json({ ok: true, ts: new Date().toISOString() }, 200, cors);
    }

    // ---- GET: CSV для ліг (як було) ----
    if (request.method === 'GET') {
      const league = url.searchParams.get('league') || 'kids';
      const sheetUrls = {
        kids:        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
        sundaygames: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
      };
      const target = sheetUrls[league] || sheetUrls.kids;
      try {
        const res = await fetch(target);
        const txt = await res.text();
        return new Response(txt, {
          status: res.status,
          headers: { ...cors, 'Content-Type': 'text/csv; charset=utf-8' }
        });
      } catch (e) {
        return text('league CSV fetch failed', 502, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
      }
    }

    // ---- POST: проксі на GAS (/ або /json) ----
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/json')) {
      // 1) якщо BACKEND порожній — повертаємо контрольовану JSON-помилку (без "Invalid URL")
      if (!BACKEND) {
        return json({ status: 'ERR_PROXY', code: 'CONFIG', bodyHead: 'BACKEND is not set' }, 500, cors);
      }

      // 2) підготовка запиту (зберігаємо тип тіла, підтримуємо form-urlencoded та json)
      const reqType = (request.headers.get('content-type') || '').toLowerCase();
      const bodyText = await request.text();
      const forwardHeaders = { 'Content-Type': reqType || 'application/json; charset=utf-8' };

      // 3) форвард у GAS з безпечною обробкою відповіді
      try {
        const resp = await fetch(BACKEND, { method: 'POST', headers: forwardHeaders, body: bodyText });

        // намагаємось зрозуміти тип відповіді
        const ct = (resp.headers.get('content-type') || '').toLowerCase();
        const raw = await resp.text();

        // якщо бекенд не JSON → загортаємо у JSON, щоб фронт на res.json() не падав
        if (!ct.includes('application/json')) {
          return json({ status: 'ERR_PROXY', code: resp.status, bodyHead: raw.slice(0, 200) }, 200, cors);
        }

        // прозорий JSON-пасстру
        return new Response(raw, {
          status: resp.status,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (err) {
        return json({ status: 'ERR_PROXY', code: 'FETCH', bodyHead: String(err).slice(0, 200) }, 502, cors);
      }
    }

    // ---- Not allowed ----
    return text('Method Not Allowed', 405, cors);
  }
};

// helpers
function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
  });
}
function text(body, status = 200, headers = {}) {
  return new Response(String(body), {
    status,
    headers
  });
}
