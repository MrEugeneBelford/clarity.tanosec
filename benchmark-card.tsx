"use client";

import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// SA Industry benchmark averages by sector
const BENCHMARK_DATA: Record<string, number> = {
  "Legal & Compliance": 45,
  "Healthcare & Medical": 40,
  "Finance & Accounting": 50,
  "Retail & E-commerce": 38,
  "Construction & Engineering": 35,
  "Professional Services": 42,
  "Hospitality & Tourism": 33,
  "Education": 40,
  "Technology": 48,
  "Other": 40,
};

const DEFAULT_BENCHMARK = 40;

interface BenchmarkCardProps {
  userScore: number;
  sector: string;
}

export default function BenchmarkCard({ userScore, sector }: BenchmarkCardProps) {
  const sectorAverage = sector && BENCHMARK_DATA[sector] !== undefined 
    ? BENCHMARK_DATA[sector] 
    : DEFAULT_BENCHMARK;
  
  const displaySector = sector || "SA SME";
  const difference = userScore - sectorAverage;
  const isAboveAverage = difference > 0;
  const isBelowAverage = difference < 0;
  const isAtAverage = difference === 0;

  const getComparisonIcon = () => {
    if (isAboveAverage) return <TrendingUp className="h-5 w-5" />;
    if (isBelowAverage) return <TrendingDown className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getComparisonText = () => {
    if (isAboveAverage) return "above";
    if (isBelowAverage) return "below";
    return "at";
  };

  const getComparisonColor = () => {
    if (isAboveAverage) return "text-emerald-400";
    if (isBelowAverage) return "text-orange-400";
    return "text-yellow-400";
  };

  const getComparisonBg = () => {
    if (isAboveAverage) return "bg-emerald-400/10 border-emerald-400/30";
    if (isBelowAverage) return "bg-orange-400/10 border-orange-400/30";
    return "bg-yellow-400/10 border-yellow-400/30";
  };

  const getComparisonBadgeColor = () => {
    if (isAboveAverage) return "bg-emerald-500/20 text-emerald-400 border-emerald-400/50";
    if (isBelowAverage) return "bg-orange-500/20 text-orange-400 border-orange-400/50";
    return "bg-yellow-500/20 text-yellow-400 border-yellow-400/50";
  };

  // Calculate positions for the visual bar (0-100 scale)
  const userPosition = Math.min(Math.max(userScore, 0), 100);
  const averagePosition = Math.min(Math.max(sectorAverage, 0), 100);

  return (
    <Card className={cn("border shadow-lg", getComparisonBg())}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BarChart3 className={cn("h-5 w-5", getComparisonColor())} />
          <span className="font-semibold text-sm text-foreground">
            How do you compare?
          </span>
        </div>

        {/* Main comparison message */}
        <div className="text-center space-y-2">
          <div className={cn("flex items-center justify-center gap-2 font-bold text-lg", getComparisonColor())}>
            {getComparisonIcon()}
            <span>
              {isAboveAverage && `+${Math.abs(difference).toFixed(0)}%`}
              {isBelowAverage && `-${Math.abs(difference).toFixed(0)}%`}
              {isAtAverage && "="}
              {" "}
              {getComparisonText()} average
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            You scored {isAboveAverage ? "above" : isBelowAverage ? "below" : "at"} the {displaySector} average for SA businesses
          </p>
        </div>

        {/* Visual comparison bar */}
        <div className="space-y-2">
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            {/* Sector average marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/80 z-10"
              style={{ left: `${averagePosition}%` }}
            />
            
            {/* User score fill */}
            <div 
              className={cn(
                "absolute top-0 bottom-0 rounded-full transition-all duration-500",
                isAboveAverage ? "bg-emerald-500" : isBelowAverage ? "bg-orange-500" : "bg-yellow-500"
              )}
              style={{ width: `${userPosition}%` }}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted/50 border border-muted-foreground/30" />
              <span className="text-muted-foreground">0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted/50 border border-muted-foreground/30" />
              <span className="text-muted-foreground">100%</span>
            </div>
          </div>
        </div>

        {/* Score markers legend */}
        <div className="flex justify-between items-center pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isAboveAverage ? "bg-emerald-500" : isBelowAverage ? "bg-orange-500" : "bg-yellow-500")} />
            <span className="text-sm font-medium">Your score: <span className={getComparisonColor()}>{userScore.toFixed(0)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
            <span className="text-sm text-muted-foreground">Avg: {sectorAverage}%</span>
          </div>
        </div>

        {/* Badge indicator */}
        <div className="flex justify-center">
          <div className={cn("px-3 py-1 rounded-full text-xs font-semibold border", getComparisonBadgeColor())}>
            {isAboveAverage && "🏆 Above Average"}
            {isBelowAverage && "📈 Room to Improve"}
            {isAtAverage && "⚖️ At Average"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
