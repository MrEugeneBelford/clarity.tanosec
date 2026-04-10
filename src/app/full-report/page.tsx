import FullReport from "@/components/FullReport";

export default async function FullReportPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const action =
    resolvedSearchParams?.action === "print" || resolvedSearchParams?.action === "pdf"
      ? (resolvedSearchParams.action as "print" | "pdf")
      : undefined;
  return <FullReport action={action} />;
}
