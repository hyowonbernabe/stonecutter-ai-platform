interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  detailColor?: string;
}

export function KpiCard({ label, value, detail, detailColor = "text-muted-foreground" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-tight text-card-foreground"
         style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      {detail && (
        <p className={`mt-1 text-xs font-medium ${detailColor}`} style={{ fontVariantNumeric: "tabular-nums" }}>
          {detail}
        </p>
      )}
    </div>
  );
}
