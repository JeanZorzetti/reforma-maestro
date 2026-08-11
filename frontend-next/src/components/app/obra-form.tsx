"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createObra, updateObra } from "@/server/actions/obras";

const formSchema = z.object({
  nome: z.string().min(1, "O nome da obra é obrigatório.").max(120),
  orcamentoTeto: z.string().min(1, "Informe o orçamento teto."),
  reservaPct: z.string().min(1, "Informe o fundo de reserva."),
});

type FormValues = z.infer<typeof formSchema>;

export interface ObraFormProps {
  obraId?: string;
  defaultValues?: Partial<FormValues>;
}

export function ObraForm({ obraId, defaultValues }: ObraFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [acessoNegado, setAcessoNegado] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", orcamentoTeto: "", reservaPct: "10", ...defaultValues },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const formData = new FormData();
      if (obraId) formData.set("obraId", obraId);
      formData.set("nome", values.nome);
      formData.set("orcamentoTeto", values.orcamentoTeto);
      formData.set("reservaPct", values.reservaPct);

      if (obraId) {
        const result = await updateObra(formData);
        if (!result.ok) {
          if (result.error === "ACESSO_SOMENTE_LEITURA") {
            setAcessoNegado(true);
          } else if (result.fields) {
            for (const [field, message] of Object.entries(result.fields)) {
              form.setError(field as keyof FormValues, { message });
            }
          }
          return;
        }
        router.push(`/app/obras/${obraId}`);
      } else {
        const result = await createObra(formData);
        if (!result.ok) {
          if (result.error === "ACESSO_SOMENTE_LEITURA") {
            setAcessoNegado(true);
          } else if (result.fields) {
            for (const [field, message] of Object.entries(result.fields)) {
              form.setError(field as keyof FormValues, { message });
            }
          }
          return;
        }
        router.push(`/app/obras/${result.data.obraId}`);
      }
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da obra</FormLabel>
              <FormControl>
                <Input placeholder="Reforma do apartamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="orcamentoTeto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orçamento teto (R$)</FormLabel>
              <FormControl>
                <Input placeholder="85.000,00" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reservaPct"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fundo de reserva (%)</FormLabel>
              <FormControl>
                <Input placeholder="10" inputMode="decimal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {acessoNegado && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            Seu acesso está limitado à leitura.{" "}
            <Link href="/app/assinar" className="underline">
              Assine para continuar.
            </Link>
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Salvando..." : obraId ? "Salvar alterações" : "Cadastrar obra"}
        </Button>
      </form>
    </Form>
  );
}
