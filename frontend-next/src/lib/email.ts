import { Resend } from "resend";
import type { IncidentKind } from "@/lib/incidents";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Reforma Maestro <contato@reformamaestro.com.br>";

async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({ from: FROM, to, subject, html });
}

interface IncidentEmailParams {
  kind: IncidentKind;
  route: string;
  message: string;
  count: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  userId?: string;
}

/** Ausência de INCIDENT_EMAIL desliga só o envio — o registro em `incidents` já aconteceu. */
export async function sendIncidentEmail(params: IncidentEmailParams) {
  const to = process.env.INCIDENT_EMAIL;
  if (!to) return;

  const lines = [
    `Tipo: ${params.kind}`,
    `Rota: ${params.route}`,
    `Mensagem: ${params.message}`,
    `Ocorrências: ${params.count}`,
    `Primeira ocorrência: ${params.firstSeenAt.toISOString()}`,
    `Última ocorrência: ${params.lastSeenAt.toISOString()}`,
  ];
  if (params.userId) lines.push(`Usuário afetado: ${params.userId}`);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[Reforma Maestro] ${params.kind}: ${params.route}`,
    text: lines.join("\n"),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail(
    to,
    "Redefinir sua senha",
    `<p>Clique no link abaixo para redefinir sua senha. O link expira em 1 hora.</p>
     <p><a href="${resetUrl}">${resetUrl}</a></p>
     <p>Se você não pediu essa redefinição, ignore este e-mail.</p>`,
  );
}

export async function sendTrialExpiringEmail(to: string, diasRestantes: number) {
  await sendEmail(
    to,
    `Seu teste grátis termina em ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"}`,
    `<p>Faltam ${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} para o fim do seu teste grátis.</p>
     <p>Assine para manter o acesso completo às suas obras.</p>`,
  );
}

export async function sendPaymentFailedEmail(to: string) {
  await sendEmail(
    to,
    "Não conseguimos processar seu pagamento",
    `<p>Houve uma falha ao cobrar sua assinatura. Atualize seus dados de pagamento
     para evitar a suspensão do acesso.</p>`,
  );
}

export async function sendSuspensaoIminenteEmail(to: string) {
  await sendEmail(
    to,
    "Seu acesso será suspenso em breve",
    `<p>Ainda não conseguimos regularizar o pagamento da sua assinatura. Em 2 dias
     seu acesso passará a ser somente leitura.</p>
     <p>Atualize seus dados de pagamento para evitar a interrupção.</p>`,
  );
}
