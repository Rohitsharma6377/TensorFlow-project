import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminContactsPage() {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'subject', header: 'Subject' },
    { key: 'status', header: 'Status' },
  ] as const;

  const data: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Contacts" subtitle="Manage contact submissions" />
      <Section title="All Contacts" description="View, filter, and export">
        <DataTable columns={columns as any} data={data} />
      </Section>
    </div>
  );
}
