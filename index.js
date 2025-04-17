export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const googleScriptURL = "https://script.google.com/macros/s/AKfycbx-O8cd8NWEaZbNzV5UrpGpfnZz_qPyQ_EV3roWGLivLDCrlRM72hqGdjUCIBs_tHwZTw/exec";

    try {
      // Прочитуємо тіло як текст (а не JSON!)
      const rawBody = await request.text();

      const response = await fetch(googleScriptURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: rawBody,
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
      return new Response("❌ Proxy error: " + err.message, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain",
        },
      });
    }
  }
}
