/**
 * `error` é texto livre; os códigos abaixo são os que a UI já trata:
 * SESSAO_EXPIRADA, CREDENCIAIS_INVALIDAS, SENHA_INCORRETA, VALIDACAO,
 * TOKEN_INVALIDO, MUITAS_TENTATIVAS (rate limit, FR-005/FR-006),
 * STRIPE_INDISPONIVEL (cancelamento de assinatura falhou, FR-010).
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string>; retryAfterSeconds?: number };
