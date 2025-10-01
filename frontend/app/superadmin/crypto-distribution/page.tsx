import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";

export default function SuperAdminCryptoDistributionPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Crypto Distribution" subtitle="Tokenomics and rewards" />
      <Section title="Overview" description="Manage distribution pools and schedules">
        <div className="text-slate-600">Configure allocations, cliffs, and vesting.</div>
      </Section>
    </div>
  );
}
