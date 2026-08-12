/** Hook nativo do Next 16 — pega exceção não tratada em Server Component, Route Handler e Server Action (FR-001). */
export async function onRequestError(error: unknown, request: { path: string }) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Import dinâmico: recordIncident usa node:crypto, indisponível no bundle de Edge Instrumentation.
  const { recordIncident } = await import("@/lib/incidents");
  await recordIncident("server_error", request.path, error);
}
