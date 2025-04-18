export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const raw = await request.text(); // <-- тут точно НЕ .json()

     const response = await fetch(
  "https://script.google.com/macros/s/AKfycbxcKOjv2XdB9bsxAFE4B5n1Iqd1H4TWHDsQAMq_sHA5crar5uLaXL3B3JgYs43l65SHoA/exec",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: raw
  }
);


      const text = await response.text();

      return new Response(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain"
        }
      });

    } catch (err) {
      return new Response("❌ Worker помилка: " + err.message, {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain"
        }
      });
    }
  }
}
