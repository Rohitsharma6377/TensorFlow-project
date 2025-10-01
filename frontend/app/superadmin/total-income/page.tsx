import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminTotalIncomePage() {
  const columns = [
    { key: 'month', header: 'Month' },
    { key: 'orders', header: 'Orders' },
    { key: 'gross', header: 'Gross' },
    { key: 'net', header: 'Net' },
  ] as const;

  const data: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Total Income" subtitle="Revenue breakdown" />
      <Section title="Summary" description="Aggregated monthly earnings">
        <DataTable columns={columns as any} data={data} />
      </Section>
    </div>
  );
}
