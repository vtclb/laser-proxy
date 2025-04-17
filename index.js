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

    const rawBody = await request.text(); // читаємо тіло як текст, не json

    const response = await fetch("https://script.google.com/macros/s/AKfycbx-O8cd8NWEaZbNzV5UrpGpfnZz_qPyQ_EV3roWGLivLDCrlRM72hqGdjUCIBs_tHwZTw/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: rawBody
    });

    const result = await response.text();

    return new Response(result, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain"
      },
    });
  }
}
