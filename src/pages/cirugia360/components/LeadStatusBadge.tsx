import type { DashboardLead } from "../lib/types";
import { getLeadStatus } from "../lib/status";

export const LeadStatusBadge = ({ lead }: { lead: DashboardLead }) => {
  const status = getLeadStatus(lead);

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${status.className}`}>
      {status.label}
    </span>
  );
};
