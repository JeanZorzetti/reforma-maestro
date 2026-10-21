import { NextResponse } from "next/server";

// Fora do ar desde 21/10/2026, a pedido do dono: todo endereço responde 410 com noindex,
// para o Google tirar o site do índice. Para religar, reverter este commit.
const PAGINA = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Site fora do ar</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#fafafa;color:#222}main{max-width:32rem;padding:2rem 1rem;text-align:center}</style>
</head>
<body><main><h1>Este site saiu do ar</h1><p>O endereço não está mais em uso.</p></main></body>
</html>`;

export default function middleware() {
  return new NextResponse(PAGINA, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "no-store",
    },
  });
}

export const config = { matcher: "/:path*" };
