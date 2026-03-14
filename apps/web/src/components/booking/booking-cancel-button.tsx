"use client";

import { useTransition } from "react";
import { LoaderCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface BookingCancelButtonProps {
  bookingId: string;
  status: "pendente" | "aprovado" | "rejeitado" | "cancelado";
}

export function BookingCancelButton({ bookingId, status }: BookingCancelButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCancel() {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST"
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Falha ao cancelar o agendamento.");
      }

      toast.success("Agendamento cancelado com sucesso.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Não foi possível cancelar o agendamento."
      );
    }
  }

  const disabled =
    isPending || (status !== "pendente" && status !== "aprovado");

  return (
    <Button
      disabled={disabled}
      onClick={() => void handleCancel()}
      size="default"
      type="button"
      variant="danger"
    >
      {isPending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      Cancelar
    </Button>
  );
}

