import { Activity } from "lucide-react";
import { formatMetric } from "../lib/format";
import type { DashboardMetric } from "../lib/types";

export const MetricTile = ({ metric }: { metric: DashboardMetric }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-500">{metric.label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <strong className="text-2xl font-semibold text-slate-950">{formatMetric(metric)}</strong>
      <Activity className="h-5 w-5 text-teal-700" />
    </div>
  </article>
);
