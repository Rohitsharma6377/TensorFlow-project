import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminShopsPage() {
  const columns = [
    { key: 'name', header: 'Shop' },
    { key: 'owner', header: 'Owner' },
    { key: 'orders', header: 'Orders' },
    { key: 'status', header: 'Status' },
  ] as const;

  const data: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Shops" subtitle="Manage merchant stores" />
      <Section title="All Shops" description="Approve, suspend, and review">
        <DataTable columns={columns as any} data={data} />
      </Section>
    </div>
  );
}
