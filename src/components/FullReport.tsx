"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Types kept in sync with generate-security-recommendations.ts
type RecPriority = "high" | "medium" | "low";

type Recommendation = {
  recommendation: string;
  priority: RecPriority;
};

type ReportPayload = {
  score: number;
  maxScore: number;
  categoryScores: Record<string, { score: number; maxScore: number; count: number }>;
  recommendations: {
    risks: string[];
    strengths: string[];
    recommendations: Recommendation[];
  };
  // Optional display fields
  generatedAt?: string; // ISO date
};

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function FullReport({ action }: { action?: "print" | "pdf" }) {
  const [data, setData] = useState<ReportPayload | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const scorePct = useMemo(() => {
    if (!data) return 0;
    const pct = data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0;
    return Math.round(pct);
  }, [data]);

  const prioritized = useMemo(() => {
    if (!data) return { high: [], medium: [], low: [] } as Record<RecPriority, Recommendation[]>;
    const items = data.recommendations.recommendations;
    return {
      high: items.filter((r) => r.priority === "high"),
      medium: items.filter((r) => r.priority === "medium"),
      low: items.filter((r) => r.priority === "low"),
    };
  }, [data]);

  useEffect(() => {
    // Load payload stored by results page
    try {
      const raw = localStorage.getItem("clarity_full_report_payload");
      if (raw) {
        const parsed = JSON.parse(raw) as ReportPayload;
        setData(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Auto-trigger actions when data is ready
    if (!data || !action) return;

    const handle = setTimeout(async () => {
      const root = document.documentElement;
      // Force light theme and flat backgrounds during export
      root.classList.add("pdf-mode");
      try {
        if (action === "print") {
          window.print();
        }
        if (action === "pdf") {
          const el = reportRef.current;
          if (!el) return;
          const dateStr = formatDate(new Date());
          const opt = {
            margin: 15,
            filename: `tanosec-clarity-report-${dateStr}.pdf`,
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollY: 0 },
            jsPDF: { unit: "mm", format: "a4", orientation: "p" },
            pagebreak: { mode: ["css", "legacy", "avoid-all"] },
          } as const;
          await html2pdf().set(opt).from(el).save();
        }
      } finally {
        root.classList.remove("pdf-mode");
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [data, action]);

  if (!data) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center p-6">
        <p className="text-muted-foreground">Preparing your report...</p>
      </main>
    );
  }

  const dateDisplay = data.generatedAt ? new Date(data.generatedAt) : new Date();

  return (
    <main className="flex min-h-svh w-full flex-col items-center p-4 md:p-8 font-body">
      <div id="full-report" ref={reportRef} className="w-full max-w-5xl space-y-6">
        {/* Branding Header */}
        <div className="brand-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 brand-logo">
              <Logo size="small" />
              <h1 className="text-xl md:text-2xl font-bold text-black">
                Clarity Cybersecurity Assessment Report
              </h1>
            </div>
            <div className="text-sm text-black">
              Date: {dateDisplay.toLocaleDateString()} | Score: {scorePct}/100
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-2xl">Overall Security Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-7xl font-bold">{scorePct}%</p>
              <p className="text-muted-foreground">This score reflects your cybersecurity posture.</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp /> Domain Scores
              </CardTitle>
              <CardDescription>A breakdown across security domains.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(data.categoryScores).map(([catId, scores]) => {
                if (scores.count === 0) return null;
                const pct = scores.maxScore > 0 ? (scores.score / scores.maxScore) * 100 : 0;
                return (
                  <div key={catId} className="flex items-center gap-4 rounded-lg border p-3" style={{ breakInside: "avoid" }}>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold">{catId}</p>
                        <p className="text-sm font-bold text-muted-foreground">
                          {scores.score}/{scores.maxScore}
                        </p>
                      </div>
                      <Progress value={pct} className="h-2 mt-1" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* AI Summary */}
        <Card className="page-break">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="text-primary" /> AI-Powered Summary
            </CardTitle>
            <CardDescription>
              Our AI has analyzed your results to highlight your key risks and strengths.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4" style={{ breakInside: "avoid" }}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ThumbsDown className="text-destructive" /> Top Risks
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {data.recommendations.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-4" style={{ breakInside: "avoid" }}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ThumbsUp className="text-green-500" /> Top Strengths
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                {data.recommendations.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Sections - Basic/Intermediate/Advanced mapped from low/medium/high */}
        <section className="space-y-4 page-break">
          <h2 className="text-2xl font-bold">Basic Recommendations</h2>
          {prioritized.low.length > 0 ? (
            prioritized.low.map((rec, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4" style={{ breakInside: "avoid" }}>
                <Badge variant="secondary">Basic</Badge>
                <p className="flex-1">{rec.recommendation}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No basic recommendations.</p>
          )}
        </section>

        <section className="space-y-4 page-break">
          <h2 className="text-2xl font-bold">Intermediate Recommendations</h2>
          {prioritized.medium.length > 0 ? (
            prioritized.medium.map((rec, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4" style={{ breakInside: "avoid" }}>
                <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">Intermediate</Badge>
                <p className="flex-1">{rec.recommendation}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No intermediate recommendations.</p>
          )}
        </section>

        <section className="space-y-4 page-break">
          <h2 className="text-2xl font-bold">Advanced Recommendations</h2>
          {prioritized.high.length > 0 ? (
            prioritized.high.map((rec, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4" style={{ breakInside: "avoid" }}>
                <Badge variant="destructive">Advanced</Badge>
                <p className="flex-1">{rec.recommendation}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No advanced recommendations. Great job!</p>
          )}
        </section>

        {/* Branding Footer (every page in print) */}
        <div className="brand-footer">
          <div className="flex items-center justify-between">
            <span>Tanosec Cybersecurity – https://tanosec.co.za</span>
            <span>Confidential – generated by Tanosec Clarity</span>
          </div>
        </div>
      </div>
    </main>
  );
}
