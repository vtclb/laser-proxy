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
      // 🟢 НЕ JSON, а просто текст
      const raw = await request.text();

      // 🔁 Відправляємо як є, без перетворення
      const response = await fetch("https://script.google.com/macros/s/AKfycbx-O8cd8NWEaZbNzV5UrpGpfnZz_qPyQ_EV3roWGLivLDCrlRM72hqGdjUCIBs_tHwZTw/exec", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: raw
      });

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
