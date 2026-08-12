import { describe, expect, it } from "vitest";
import { fingerprint, normalize } from "@/lib/incidents";

describe("normalize", () => {
  it("substitui UUID por '?'", () => {
    expect(normalize("erro no usuário 3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(
      "erro no usuário ?",
    );
  });

  it("substitui sequência de dígitos por '?'", () => {
    expect(normalize("timeout após 12345 ms")).toBe("timeout após ? ms");
  });
});

describe("fingerprint", () => {
  it("mesma mensagem com UUIDs e números diferentes normaliza para o mesmo hash", () => {
    const a = fingerprint("server_error", "/app/obras", "falha ao ler obra 11111111-1111-1111-1111-111111111111 (tentativa 3)");
    const b = fingerprint("server_error", "/app/obras", "falha ao ler obra 22222222-2222-2222-2222-222222222222 (tentativa 42)");
    expect(a).toBe(b);
  });

  it("kind diferente gera hash diferente", () => {
    const a = fingerprint("server_error", "/app/obras", "erro genérico");
    const b = fingerprint("webhook_failed", "/app/obras", "erro genérico");
    expect(a).not.toBe(b);
  });

  it("route diferente gera hash diferente", () => {
    const a = fingerprint("server_error", "/app/obras", "erro genérico");
    const b = fingerprint("server_error", "/app/conta", "erro genérico");
    expect(a).not.toBe(b);
  });
});
