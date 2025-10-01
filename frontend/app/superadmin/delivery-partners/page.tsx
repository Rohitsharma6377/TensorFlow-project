import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminDeliveryPartnersPage() {
  const columns = [
    { key: 'name', header: 'Partner' },
    { key: 'region', header: 'Region' },
    { key: 'sla', header: 'SLA' },
    { key: 'status', header: 'Status' },
  ] as const;

  const data: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Partners" subtitle="Couriers and SLAs" />
      <Section title="Partners" description="Enable/disable and set coverage">
        <DataTable columns={columns as any} data={data} />
      </Section>
    </div>
  );
}
