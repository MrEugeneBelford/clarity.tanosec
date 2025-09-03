import FullReport from "@/components/FullReport";

export default function FullReportPage({ searchParams }: { searchParams: { action?: string } }) {
  const action = (searchParams?.action === "print" || searchParams?.action === "pdf") ? (searchParams.action as "print" | "pdf") : undefined;
  return <FullReport action={action} />;
}
