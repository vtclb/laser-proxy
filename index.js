export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- CORS (віддзеркалюємо Origin) ----
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    // ---- OPTIONS (preflight) ----
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // ---- GET: CSV для ліг (без змін по суті) ----
    if (request.method === 'GET') {
      const league = url.searchParams.get('league') || 'kids';
      const sheetUrls = {
        kids:        'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
        sundaygames: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPз7SQGpKkyFwз4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
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
        return new Response('league CSV fetch failed', {
          status: 502,
          headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    // ---- POST: проксі на GAS ----
    if (request.method === 'POST') {
      const backend = env.GAS_URL || env.WEB_APP_URL;

      // 1) конфіг відсутній → контрольована JSON-помилка (а не Invalid URL)
      if (!backend) {
        const payload = { status: 'ERR_PROXY', code: 'CONFIG', bodyHead: 'GAS_URL/WEB_APP_URL is not set' };
        return new Response(JSON.stringify(payload), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }

      // 2) підготовка запиту (зберігаємо тип тіла, підтримуємо form-urlencoded та json)
      const reqType = (request.headers.get('content-type') || '').toLowerCase();
      const bodyText = await request.text();
      const forwardHeaders = { 'Content-Type': reqType || 'application/json; charset=utf-8' };

      // 3) форвард у GAS з безпечною обробкою відповіді
      try {
        const resp = await fetch(backend, { method: 'POST', headers: forwardHeaders, body: bodyText });
        const text = await resp.text();
        const respType = (resp.headers.get('content-type') || '').toLowerCase();

        // якщо бекенд не повернув JSON → обгортаємо у JSON, щоб фронт не падав
        if (!respType.includes('application/json')) {
          const payload = { status: 'ERR_PROXY', code: resp.status, bodyHead: text.slice(0, 200) };
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }

        // прозорий JSON-пасстру
        return new Response(text, {
          status: resp.status,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (err) {
        const payload = { status: 'ERR_PROXY', code: 'FETCH', bodyHead: String(err).slice(0, 200) };
        return new Response(JSON.stringify(payload), {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    // ---- інші методи ----
    return new Response('Method Not Allowed', { status: 405, headers: cors });
  }
};
