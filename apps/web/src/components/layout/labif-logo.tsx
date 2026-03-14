import Image from "next/image";

import { cn } from "@/lib/utils/cn";

interface LabifLogoProps {
  className?: string;
  compact?: boolean;
  vertical?: boolean;
}

export function LabifLogo({ className, compact = false, vertical = false }: LabifLogoProps) {
  if (vertical) {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <Image
          alt="Instituto Federal São Paulo"
          className="h-24 w-auto object-contain"
          height={1042}
          priority
          src="/branding/ifsp-logo-v.png"
          width={900}
        />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          LabIF Maker
        </p>
        <p className="text-xs text-slate-500">IFSP Campus Jacareí</p>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        alt="IFSP Jacarei"
        className="h-14 w-auto object-contain"
        height={521}
        priority
        src="/branding/ifsp-campus-jacarei.png"
        width={450}
      />
      <div className={compact ? "hidden sm:block" : "block"}>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-brand-600 sm:text-sm">
          LabIF Maker
        </p>
        <p className="text-xs text-slate-600 sm:text-sm">IFSP Campus Jacareí</p>
      </div>
    </div>
  );
}
