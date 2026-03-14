import { requireCoordinator } from "@/lib/auth/guards";

export default async function CoordinatorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireCoordinator();

  return children;
}
