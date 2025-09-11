// workers/gas-proxy.js
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

    // ---- GET: CSV for leagues (unchanged, but stricter) ----
    if (request.method === 'GET') {
      const league = url.searchParams.get('league') || 'kids';
      const sheetUrls = {
        kids:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
        sunday: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
      };
      const target = sheetUrls[league] || sheetUrls.kids;
      const res = await fetch(target);
      const txt = await res.text();
      return new Response(txt, {
        status: res.status,
        headers: { ...cors, 'Content-Type': 'text/csv; charset=utf-8' }
      });
    }

    // ---- POST: forward to GAS ----
    if (request.method === 'POST') {
      // Вкажи тут НОВИЙ JSON URL введення в дію:
      const GAS_JSON_EXEC = 'https://script.google.com/macros/s/AKfycbyXQz_D2HMtVJRomi83nK3iuIMSPKOehg2Lesj7IvHE1TwpqCiHqVCPwsvboxigvV1yIA/exec';
      // Якщо десь лишився старий form-urlencoded (legacy saveResult) — можна вказати окремо:
      const GAS_FORM_EXEC = GAS_JSON_EXEC; // або інший exec, якщо так налаштовано

      const ctype = request.headers.get('content-type') || '';
      let targetUrl = GAS_JSON_EXEC;
      let forwardHeaders = {};
      let body;

      if (ctype.includes('application/json')) {
        // JSON → JSON
        const raw = await request.text();
        body = raw; // уже JSON
        forwardHeaders['Content-Type'] = 'application/json;charset=utf-8';
      } else if (ctype.includes('application/x-www-form-urlencoded')) {
        // legacy form → залишаємо form
        const raw = await request.text();
        body = raw;
        forwardHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
        targetUrl = GAS_FORM_EXEC;
      } else {
        // Якщо не вказано — вважаємо JSON
        const raw = await request.text();
        body = raw || '{}';
        forwardHeaders['Content-Type'] = 'application/json;charset=utf-8';
      }

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: forwardHeaders,
        body
      });

      const text = await resp.text();
      const respType = resp.headers.get('content-type') || 'application/json;charset=utf-8';

      return new Response(text, {
        status: resp.status,
        headers: { ...cors, 'Content-Type': respType }
      });
    }

    return new Response('Method Not Allowed', { status: 405, headers: cors });
  }
};
