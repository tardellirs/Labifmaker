"use client";

import { startTransition, useEffect, useState } from "react";
import { LoaderCircle, MailPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoordinatorEmailManagerProps {
  emails: string[];
  notificationRecipients: string[];
}

export function CoordinatorEmailManager({
  emails,
  notificationRecipients
}: CoordinatorEmailManagerProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [savingRecipients, setSavingRecipients] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState(notificationRecipients);

  useEffect(() => {
    setSelectedRecipients(notificationRecipients);
  }, [notificationRecipients]);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/coordinator-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao adicionar coordenador.");
      }

      const normalizedEmail = email.trim().toLowerCase();
      toast.success("E-mail de coordenador adicionado.");
      setEmail("");
      setSelectedRecipients((current) =>
        current.includes(normalizedEmail) ? current : [...current, normalizedEmail]
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao adicionar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(currentEmail: string) {
    setConfirmEmail(null);
    setRemovingEmail(currentEmail);

    try {
      const response = await fetch("/api/coordinator-emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao remover coordenador.");
      }

      toast.success("E-mail de coordenador removido.");
      setSelectedRecipients((current) =>
        current.filter((emailAddress) => emailAddress !== currentEmail)
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao remover.");
    } finally {
      setRemovingEmail(null);
    }
  }

  async function handleSaveRecipients() {
    setSavingRecipients(true);

    try {
      const response = await fetch("/api/coordinator-emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedRecipients })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao atualizar destinatarios.");
      }

      toast.success("Destinatários de notificação atualizados.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Falha ao salvar seleção.");
    } finally {
      setSavingRecipients(false);
    }
  }

  return (
    <>
      <Dialog onOpenChange={(open) => { if (!open) setConfirmEmail(null); }} open={confirmEmail !== null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover coordenador</DialogTitle>
            <DialogDescription>
              Deseja realmente remover o acesso de coordenador para o e-mail:
            </DialogDescription>
          </DialogHeader>

          <p className="mt-1 break-all rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
            {confirmEmail}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Essa ação pode ser desfeita adicionando o e-mail novamente.
          </p>

          <div className="mt-5 flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              disabled={removingEmail === confirmEmail}
              onClick={() => confirmEmail && void handleRemove(confirmEmail)}
              type="button"
              variant="danger"
            >
              {removingEmail === confirmEmail ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remover coordenador
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <Badge variant="brand">Acesso</Badge>
        <CardTitle className="mt-4">Gerencie e-mails de coordenadores.</CardTitle>
        <CardDescription className="mt-3">
          Qualquer e-mail adicionado aqui terá acesso ao portal como coordenador, independente do domínio.
        </CardDescription>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleAdd(event)}>
          <div className="space-y-2">
            <Label htmlFor="coordinator-email">Novo e-mail de coordenador</Label>
            <Input
              id="coordinator-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@exemplo.com"
              required
              type="email"
              value={email}
            />
          </div>

          <Button disabled={loading} type="submit">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
            Adicionar coordenador
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {emails.map((currentEmail) => (
            <div
              className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
              key={currentEmail}
            >
              <p className="text-sm text-slate-700">{currentEmail}</p>
              <Button
                disabled={removingEmail === currentEmail}
                onClick={() => setConfirmEmail(currentEmail)}
                size="icon"
                type="button"
                variant="ghost"
              >
                {removingEmail === currentEmail ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-950">Quem recebe todos os e-mails do sistema</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Esses coordenadores recebem aviso de nova solicitação e atualizações operacionais enviadas pelo portal.
          </p>

          <div className="mt-4 space-y-3">
            {emails.map((currentEmail) => (
              <label
                className="flex items-center justify-between gap-3 rounded-[18px] border border-white bg-white px-4 py-3 text-sm text-slate-700"
                key={`${currentEmail}-recipient`}
              >
                <span>{currentEmail}</span>
                <input
                  checked={selectedRecipients.includes(currentEmail)}
                  className="h-4 w-4 rounded border border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => {
                    setSelectedRecipients((current) =>
                      event.target.checked
                        ? [...new Set([...current, currentEmail])]
                        : current.filter((emailAddress) => emailAddress !== currentEmail)
                    );
                  }}
                  type="checkbox"
                />
              </label>
            ))}
          </div>

          <Button
            className="mt-4"
            disabled={savingRecipients}
            onClick={() => void handleSaveRecipients()}
            type="button"
            variant="secondary"
          >
            {savingRecipients ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <MailPlus className="h-4 w-4" />
            )}
            Salvar destinatários
          </Button>
        </div>
      </Card>
    </>
  );
}
