import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
}

interface StatsCardsProps {
  stats: StatCard[];
  className?: string;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, className }) => {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stat.value}</div>

                {stat.description && (
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {stat.trend && (
                    <div
                      className={cn(
                        "flex items-center text-xs",
                        stat.trend.positive
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      <span
                        className={cn(
                          "mr-1",
                          stat.trend.positive
                            ? "text-success"
                            : "text-destructive",
                        )}
                      >
                        {stat.trend.positive ? "↗" : "↘"}
                      </span>
                      {stat.trend.value}% {stat.trend.label}
                    </div>
                  )}

                  {stat.badge && (
                    <Badge
                      variant={stat.badge.variant || "outline"}
                      className={cn("text-xs", stat.badge.className)}
                    >
                      {stat.badge.text}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
