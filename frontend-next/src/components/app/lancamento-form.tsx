"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLancamento, updateLancamento } from "@/server/actions/lancamentos";
import { trackEvent } from "@/lib/analytics";

const CATEGORIAS = [
  { value: "material", label: "Material" },
  { value: "mao_de_obra", label: "Mão de Obra" },
  { value: "taxas", label: "Taxas" },
  { value: "mobilia", label: "Mobília" },
] as const;

const formSchema = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato dd/MM/yyyy."),
  categoria: z.enum(["material", "mao_de_obra", "taxas", "mobilia"]),
  item: z.string().min(1, "O item é obrigatório.").max(200),
  fornecedor: z.string().max(200).optional(),
  previsto: z.string().min(1, "Informe o valor previsto."),
  pago: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function hoje(): string {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

function isDataFutura(data: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return date.getTime() > hoje.getTime();
}

export interface LancamentoFormProps {
  obraId: string;
  lancamentoId?: string;
  defaultValues?: Partial<FormValues>;
}

export function LancamentoForm({ obraId, lancamentoId, defaultValues }: LancamentoFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [acessoNegado, setAcessoNegado] = useState(false);
  const draftKey = `lancamento-draft-${obraId}`;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data: hoje(),
      categoria: "material",
      item: "",
      fornecedor: "",
      previsto: "",
      pago: "",
      ...defaultValues,
    },
  });

  // Restaura rascunho salvo antes da sessão expirar (edge case do spec).
  useEffect(() => {
    if (lancamentoId) return;
    const saved = sessionStorage.getItem(draftKey);
    if (saved) form.reset(JSON.parse(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lancamentoId) return;
    const subscription = form.watch((values) => {
      sessionStorage.setItem(draftKey, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form, draftKey, lancamentoId]);

  const dataValue = form.watch("data");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("obraId", obraId);
      if (lancamentoId) formData.set("lancamentoId", lancamentoId);
      formData.set("data", values.data);
      formData.set("categoria", values.categoria);
      formData.set("item", values.item);
      formData.set("fornecedor", values.fornecedor ?? "");
      formData.set("previsto", values.previsto);
      formData.set("pago", values.pago ?? "");

      const result = lancamentoId ? await updateLancamento(formData) : await createLancamento(formData);

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

      if (!lancamentoId) trackEvent("lancamento_criado");
      sessionStorage.removeItem(draftKey);
      router.push(`/app/obras/${obraId}/lancamentos`);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input placeholder="dd/MM/yyyy" {...field} />
              </FormControl>
              {isDataFutura(dataValue) && (
                <p className="text-xs text-muted-foreground">Data futura — gasto ainda não realizado.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <FormControl>
                <Input placeholder="Cimento CP-II" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fornecedor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <FormControl>
                <Input placeholder="Depósito Central" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="previsto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsto (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="1.200,00" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pago (R$)</FormLabel>
                <FormControl>
                  <Input placeholder="0,00" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {acessoNegado && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
            Seu acesso está limitado à leitura.{" "}
            <Link href="/app/assinar" className="underline">
              Assine para continuar lançando gastos.
            </Link>
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Salvando..." : lancamentoId ? "Salvar alterações" : "Lançar gasto"}
        </Button>
      </form>
    </Form>
  );
}
