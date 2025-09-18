export default {
  async fetch(request, env) {
    // ---- CORS ----
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    // ---- GET: CSV для ліг ----
    if (request.method === 'GET') {
      const league = url.searchParams.get('league') || 'kids';
      const sheetUrls = {
        kids:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
        sundaygames:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
      };
      const target = sheetUrls[league] || sheetUrls.kids;
      const res = await fetch(target);
      const txt = await res.text();
      return new Response(txt, {
        status: res.status,
        headers: { ...cors, 'Content-Type': 'text/csv; charset=utf-8' }
      });
    }

    // ---- POST: проксі на GAS ----
    if (request.method === 'POST') {
      const GAS_JSON_EXEC = env.GAS_URL || env.WEB_APP_URL;

      const ctype = request.headers.get('content-type') || '';
      let forwardHeaders = {};
      let body;

      if (ctype.includes('application/json')) {
        body = await request.text(); // уже JSON
        forwardHeaders['Content-Type'] = 'application/json;charset=utf-8';
      } else if (ctype.includes('application/x-www-form-urlencoded')) {
        body = await request.text();
        forwardHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
      } else {
        // Якщо нічого не вказано — JSON
        body = await request.text() || '{}';
        forwardHeaders['Content-Type'] = 'application/json;charset=utf-8';
      }

      try {
        const resp = await fetch(GAS_JSON_EXEC, {
          method: 'POST',
          headers: forwardHeaders,
          body
        });

        const text = await resp.text();
        const respType = (resp.headers.get('content-type') || '').toLowerCase();

        // Якщо відповідь не JSON — загортаємо в JSON-обгортку
        if (!respType.includes('application/json')) {
          return new Response(JSON.stringify({
            status: 'ERR_PROXY',
            code: resp.status,
            bodyHead: text.slice(0, 200)
          }), {
            status: 200,
            headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }

        return new Response(text, {
          status: resp.status,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });

      } catch (err) {
        return new Response(JSON.stringify({
          status: 'ERR_PROXY',
          code: 'FETCH',
          bodyHead: String(err).slice(0, 200)
        }), {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    }

    return new Response('Method Not Allowed', { status: 405, headers: cors });
  }
};
