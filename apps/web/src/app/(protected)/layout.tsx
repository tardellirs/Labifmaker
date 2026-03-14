import { ProtectedShell } from "@/components/layout/protected-shell";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthenticatedUser();

  return <ProtectedShell session={session}>{children}</ProtectedShell>;
}
