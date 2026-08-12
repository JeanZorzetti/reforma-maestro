# Quickstart: validar as melhorias da v1.1

**Feature**: `002-melhorias-v11` | **Fase**: 1 | **Data**: 2026-08-12

Guia de validação, não de implementação. Cada seção prova uma história
independentemente das outras, na ordem do `Independent Test` da spec.

## Pré-requisitos

```bash
cd frontend-next
npm install                       # nenhuma dependência nova nesta feature
```

`.env.local` precisa das variáveis de 001 mais uma:

| Variável | Origem |
|----------|--------|
| `INCIDENT_EMAIL` | **nova** — e-mail do fornecedor que recebe alerta de falha |

Ausente, o registro de incidente continua funcionando e só o envio é desligado —
útil para rodar local sem disparar e-mail.

```bash
npm run db:migrate                # aplica 0003_melhorias_v11
npm run dev
```

---

## US1 — Operar sem falhar em silêncio

### Alerta de falha no caminho do dinheiro (FR-002, SC-001)

```bash
# webhook com assinatura válida e customer que não existe no banco
stripe trigger invoice.payment_failed --override customer=cus_inexistente
```

Esperado: resposta `{ unmatched: true }`; uma linha em `incidents` com
`kind = 'webhook_failed'` e `notified_at` preenchido; e-mail em `INCIDENT_EMAIL`
identificando evento e conta. Nenhum valor em centavos, nome de fornecedor ou
item no corpo do e-mail.

Repetir o mesmo comando 5 vezes em menos de 30 min: **um** e-mail no total,
`count = 6` na linha (FR-004).

### Erro não tratado registrado (FR-001)

Forçar um `throw` temporário numa página autenticada e acessá-la. Esperado: linha
em `incidents` com `kind = 'server_error'`, rota correta, e a pessoa vendo a tela
de erro do Next — não uma tela em branco.

Conferir na linha gravada que `detail` **não** tem senha, token nem valor
financeiro.

### Rotina agendada vigiada (FR-003)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/trial-warnings
# heartbeat gravado
psql "$DATABASE_URL" -c "UPDATE heartbeats SET last_run_at = now() - interval '30 hours'"
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/watchdog
```

Esperado: `{ ok: true, stale: true }` e incidente `cron_missing` notificado.

### Limite de tentativas (FR-005 a FR-007, SC-002)

Errar a senha 10 vezes seguidas para o mesmo e-mail. Esperado: a 11ª recusada com
mensagem dizendo quando tentar de novo, e uma linha `rate_limited` em `audit_log`
sem e-mail nem hash no `detail`.

Esperar a janela e entrar com a senha correta: entra normalmente (cenário 6).

Pedir recuperação de senha 6 vezes: a resposta da 6ª é **idêntica** à da 1ª e
nenhum e-mail sai.

### Concorrência sem esgotar conexão (FR-008, SC-003)

```bash
npm test -- tests/integration/concorrencia.test.ts
```

Dispara 50 leituras simultâneas contra `DATABASE_URL_TEST`. Falha se qualquer uma
retornar erro de conexão. Antes da correção do pool, falha; depois, passa.

Conferir também no banco durante a rodada:

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
```

### Exclusão de conta (FR-009 a FR-012, SC-004)

Com uma conta de teste **com assinatura ativa em modo teste**: `/app/conta` →
excluir conta → confirmar com a senha.

Esperado: no máximo 3 interações; aviso sobre perda da exportação com link para
exportar antes; assinatura cancelada no dashboard do Stripe; obras e lançamentos
sumidos; sessão encerrada; `audit_log` com `account_deleted` e `user_id NULL`.

Com o Stripe indisponível (chave inválida), a exclusão **aborta** e a conta
continua íntegra — nunca fica assinatura órfã.

---

## US2 — Transformar o teste em assinatura

### Caminho guiado (FR-013, FR-014, SC-005)

Criar conta nova. Esperado: cai em `/app/comecar`, não num formulário em branco.
O caminho termina com a primeira obra criada, e oferece ver a obra de exemplo
com painel funcionando, marcada como exemplo e removível.

Confirmar que a obra de exemplo não conta em indicadores de uso e sai marcada na
exportação (FR-015).

**Cronometrar num celular real**: do cadastro ao primeiro gasto salvo, alvo
< 3 min sem ajuda externa.

### Data e dinheiro no celular (FR-016, FR-017, SC-006)

No celular, abrir novo lançamento: o campo de data abre o seletor nativo do
aparelho com hoje pré-selecionado, sem digitação de barras. O campo de valor
formata em reais conforme digita e recusa entrada impossível, sem exigir `R$`,
ponto ou vírgula.

### Parcelamento (FR-018 a FR-022, SC-007)

Registrar um gasto de `R$ 1.000,00` em 3 parcelas mensais. Esperado: 3
lançamentos criados de uma vez, com datas espaçadas, e a soma **exatamente**
`R$ 1.000,00` — `334, 333, 333`, sem centavo perdido (FR-019).

```bash
npm test -- tests/unit/parcelas.test.ts
```

Editar uma parcela: só ela muda. Excluir a série: avisa "isso vai remover 3
lançamentos" antes de confirmar. Tentar 200 parcelas: recusado pelo Zod e pelo
`CHECK` do banco.

---

## US3 — Enxergar o rumo da obra

### Evolução do consumo (FR-023 a FR-025, SC-008)

Numa obra com lançamentos em vários meses, abrir o painel: a curva de consumo
acumulado aparece contra a linha do teto, com o trecho já pago visualmente
distinto do previsto em data futura.

Numa obra com menos de dois meses de lançamentos: mensagem explicando o que
falta, nunca um gráfico vazio ou quebrado.

### Arquivar (FR-026 a FR-028)

Arquivar uma obra: some da lista principal, aparece em `/app/obras/arquivadas`,
exportação continua funcionando. Desarquivar: volta como estava.

Conferir que `getAccess()` devolve o mesmo `tier` antes e depois — arquivar não
muda acesso.

### Paginação e relatório (FR-029 a FR-031, SC-009)

Numa obra com 500+ lançamentos: navegação por avançar/voltar mostrando
"51–100 de 512", sem a parede de números de página.

Gerar o relatório em `/app/obras/[id]/relatorio`: documento legível, com
indicadores, quebra por categoria e lançamentos. Salvar em PDF pelo navegador e
conferir que a impressão não corta conteúdo nem inclui a navegação do app.

Com conta em `readonly`, o relatório é entregue normalmente (FR-031).

Cronometrar as duas operações: < 2 s cada.

### Funil verificado automaticamente (FR-032, SC-010)

```bash
npm test -- tests/integration/funil.test.ts
```

Percorre cadastro → trial → evento de assinatura → acesso liberado, com chave
Stripe de **modo teste**. Roda também em `.github/workflows/ci.yml` a cada push,
contra um `postgres:16` efêmero.

---

## Verificação final antes de merge

```bash
npm test          # unitários + integração
npm run build     # gate de produção do Next
npm run dev       # conferir as telas alteradas rodando
```

Rotas públicas não foram tocadas por esta feature, mas se algo em `(public)`
mudar por acidente, conferir `/sitemap.xml` e o structured data antes de subir
(Princípio II).
