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
      const json = await request.json();

      const formBody = Object.entries(json)
        .map(([key, val]) => {
          const encodedKey = encodeURIComponent(key);
          const encodedValue = Array.isArray(val)
            ? encodeURIComponent(val.join(", "))
            : encodeURIComponent(val);
          return `${encodedKey}=${encodedValue}`;
        })
        .join("&");

      const response = await fetch("https://script.google.com/macros/s/AKfycbx-O8cd8NWEaZbNzV5UrpGpfnZz_qPyQ_EV3roWGLivLDCrlRM72hqGdjUCIBs_tHwZTw/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formBody
      });

      const result = await response.text();

      return new Response(result, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain"
        }
      });

    } catch (err) {
      return new Response("❌ Проксі помилка: " + err.message, {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain"
        }
      });
    }
  }
}
