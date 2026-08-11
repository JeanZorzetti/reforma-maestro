import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Retenção de Dados e Privacidade | Reforma Maestro",
    description: "Por quanto tempo o Reforma Maestro guarda seus dados e como solicitar a exclusão da sua conta.",
};

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-background">
            <section className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert mx-auto">
                        <h1>Retenção de dados e privacidade</h1>
                        <p>
                            Esta página descreve, sem letras miúdas, o que o Reforma Maestro faz
                            com os dados da sua conta e das suas obras.
                        </p>

                        <h2>Por quanto tempo seus dados ficam guardados</h2>
                        <p>
                            Os dados de uma conta — obras, lançamentos e informações de
                            assinatura — ficam armazenados por tempo indeterminado, mesmo que a
                            conta fique inativa ou a assinatura seja cancelada. Não existe hoje
                            uma rotina automática de expurgo de contas inativas nem aviso prévio
                            de exclusão por inatividade.
                        </p>

                        <h2>Como pedir a exclusão dos seus dados</h2>
                        <p>
                            Você pode solicitar a exclusão definitiva da sua conta a qualquer
                            momento pelo e-mail{" "}
                            <a href="mailto:suporte@roilabs.com.br">suporte@roilabs.com.br</a>. A
                            exclusão é <strong>imediata e irreversível</strong>: apaga a conta, as
                            obras e os lançamentos vinculados a ela. Não guardamos backup para
                            restaurar depois.
                        </p>
                        <p>
                            Um registro mínimo de auditoria (data e tipo de evento, sem vínculo
                            com a pessoa) e o registro que impede reaproveitar o mesmo e-mail para
                            um novo teste grátis permanecem, para fins de segurança e de prevenção
                            a abuso.
                        </p>

                        <h2>Exportação antes de sair</h2>
                        <p>
                            Se você só quer levar seus dados embora sem excluir a conta, cada obra
                            tem exportação em CSV disponível a qualquer momento — inclusive com a
                            assinatura cancelada ou vencida.
                        </p>

                        <h2>LGPD</h2>
                        <p>
                            O tratamento de dados pessoais e financeiros segue a Lei Geral de
                            Proteção de Dados, incluindo o direito de exclusão descrito acima.
                            Dúvidas sobre dados pessoais também podem ser enviadas para{" "}
                            <a href="mailto:suporte@roilabs.com.br">suporte@roilabs.com.br</a>.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
