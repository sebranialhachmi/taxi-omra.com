import type { ReactNode } from "react";

export function PageHeader({ title, description, actions, eyebrow }: {
  title: string; description?: string; actions?: ReactNode; eyebrow?: string;
}) {
  return (
    <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pb-6 border-b border-border/60">
      <div className="min-w-0">
        {eyebrow && <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight truncate">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
