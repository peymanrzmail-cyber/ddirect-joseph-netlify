// netlify/edge-functions/proxy.js

const BACKEND_URL = Netlify.env.get("BACKEND_URL") || "https://us1.darkcloud.ir:4430";

export default async function handler(request, context) {
  try {
    const url = new URL(request.url);
    const targetPath = url.pathname + url.search;
    const upstreamUrl = new URL('/api-web-server' + url.search, BACKEND_URL).toString();
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("x-forwarded-proto");
    headers.delete("x-forwarded-host");
    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: headers,
      body: request.body, 
      redirect: "manual",
    });
    const upstreamResponse = await fetch(upstreamRequest);
    const responseHeaders = new Headers();
    for (const [key, value] of upstreamResponse.headers.entries()) {
      if (!["transfer-encoding", "connection", "keep-alive"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy Error: ${error.message}`, { status: 502 });
  }
}
