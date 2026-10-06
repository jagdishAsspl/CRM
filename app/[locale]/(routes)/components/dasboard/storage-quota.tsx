"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

// Single KPI card in the demo dashboard with sample inputs
export default function StorageQuota({
  actual,
  title,
}: {
  actual: number;
  title: string;
}) {
  const percent = parseFloat((100 * (actual / 2000)).toFixed(2));

  return (
    <Card className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border-border/60 hover:border-amber-500/40 group overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs">
          <Database className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {actual}
          <span className="text-sm font-normal text-muted-foreground ml-1">/ MB</span>
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{percent}% used ({actual}MB)</span>
          <span>2000 MB</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(Math.min(percent, 100), 4)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
