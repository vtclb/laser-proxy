export default {
  async fetch(request) {
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' };
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});

    const sheetUrls = {
      kids:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
      sunday: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
    };

    const url = new URL(request.url);

    if (request.method==='GET') {
      const league = url.searchParams.get('league');
      const csv = sheetUrls[league] || sheetUrls.kids;
      const res = await fetch(csv);
      const txt = await res.text();
      return new Response(txt, {status:200, headers:{...cors,'Content-Type':'text/plain'}});
    }

    if (request.method==='POST') {
      const raw = await request.text();
      const resp = await fetch(
        'https://script.google.com/macros/s/AKfycby7iFgWweOSzfSF07sTAPye4N3pDZVE8CCs0gXF5Miz0xhtGiQSQSsVCFDXy0zBD4kQzg/exec',
        {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:raw}
      );
      const t = await resp.text();
      return new Response(t, {status:200,headers:{...cors,'Content-Type':'text/plain'}});
    }

    return new Response('Method Not Allowed',{status:405,headers:cors});
  }
};
