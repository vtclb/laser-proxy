export default {
  async fetch(request) {
    const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
    const sheetUrls={
      kids: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1648067737&single=true&output=csv',
      sunday:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzum1H-NSUejvB_XMMWaTs04SPz7SQGpKkyFwz4NQjsN8hz2jAFAhl-jtRdYVAXgr36sN4RSoQSpEN/pub?gid=1286735969&single=true&output=csv'
    };
    const u = new URL(request.url);
    if (request.method==='GET'){
      const res=await fetch(sheetUrls[u.searchParams.get('league')]||sheetUrls.kids);
      return new Response(await res.text(),{status:200,headers:{...cors,'Content-Type':'text/plain'}});
    }
    if (request.method==='POST'){
      const raw=await request.text();
      const resp=await fetch('https://script.google.com/macros/s/AKfycby7iFgWweOSzfSF07sTAPye4N3pDZVE8CCs0gXF5Miz0xhtGiQSQSsVCFDXy0zBD4kQzg/exec',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:raw});
      return new Response(await resp.text(),{status:200,headers:{...cors,'Content-Type':'text/plain'}});
    }
    return new Response('Method Not Allowed',{status:405,headers:cors});
  }
};
