import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminLeadsPage() {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'source', header: 'Source' },
    { key: 'score', header: 'Score' },
  ] as const;

  const data: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Leads" subtitle="Track and score leads" />
      <Section title="Leads" description="Import, export and assign">
        <DataTable columns={columns as any} data={data} />
      </Section>
    </div>
  );
}
