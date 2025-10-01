import { PageHeader } from "../components/PageHeader";
import { KpiGrid } from "../components/KpiGrid";
import { StatCard } from "../components/StatCard";
import { Section } from "../components/Section";
import { DataTable } from "../components/DataTable";

export default function SuperAdminDashboardPage() {
  const ordersColumns = [
    { key: 'id', header: 'Order' },
    { key: 'shop', header: 'Shop' },
    { key: 'amount', header: 'Amount' },
    { key: 'status', header: 'Status' },
  ] as const;

  const recentOrders: any[] = [];

  return (
    <div className="space-y-4">
      <PageHeader title="Super Admin Dashboard" subtitle="Global KPIs, revenue, users and shops" />

      <KpiGrid>
        <StatCard label="Total Revenue" value="$182,430" hint="This month" trend={{ value: "+12.4%", positive: true }} />
        <StatCard label="Active Users" value="12,394" hint="Last 7 days" trend={{ value: "+3.1%", positive: true }} />
        <StatCard label="Active Shops" value="584" hint="Onboarded" trend={{ value: "+1.2%", positive: true }} />
        <StatCard label="Pending Payouts" value="$24,980" hint="Awaiting approval" trend={{ value: "-2.3%", positive: false }} />
      </KpiGrid>

      <Section title="Recent Orders" description="Latest activity across the platform">
        <DataTable columns={ordersColumns as any} data={recentOrders} />
      </Section>
    </div>
  )
}
