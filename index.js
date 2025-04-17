export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    try {
      const body = await request.text(); // читаємо як текст — стабільніше
      const targetUrl = "https://script.google.com/macros/s/AKfycbx-O8cd8NWEaZbNzV5UrpGpfnZz_qPyQ_EV3roWGLivLDCrlRM72hqGdjUCIBs_tHwZTw/exec";

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const responseText = await response.text();

      return new Response(responseText, {
        status: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain",
        },
      });

    } catch (err) {
      return new Response("Proxy Error: " + err.message, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain",
        },
      });
    }
  }
}
