import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { usePrioritizeTasks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function urgencyColor(urgency: string) {
  switch (urgency) {
    case "immediate": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "today": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "this week": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

export default function Prioritize() {
  const { data: tasks, isLoading } = useTasks();
  const prioritizeMutation = usePrioritizeTasks();
  const [hasRun, setHasRun] = useState(false);

  const pendingTasks = (tasks ?? []).filter((t) => t.status !== "completed");

  const handlePrioritize = () => {
    if (!pendingTasks.length) return;
    setHasRun(true);
    prioritizeMutation.mutate({
      data: {
        tasks: pendingTasks.map((t) => ({
          title: t.title,
          deadline: t.deadline,
          priority: t.priority,
          estimatedHours: t.estimatedHours,
          status: t.status,
        })),
      },
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Prioritization</h1>
          <p className="text-muted-foreground text-sm mt-1">Let AI figure out what you should tackle first.</p>
        </div>
        <Button
          data-testid="button-prioritize-tasks"
          onClick={handlePrioritize}
          disabled={!pendingTasks.length || prioritizeMutation.isPending}
          className="bg-primary hover:bg-primary/90 shrink-0"
        >
          {prioritizeMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Prioritize with AI</>
          )}
        </Button>
      </div>

      {/* Pending tasks overview */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : pendingTasks.length === 0 ? (
        <Card className="border-border/50 bg-card/60">
          <CardContent className="py-12 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground">No pending tasks to prioritize.</p>
          </CardContent>
        </Card>
      ) : !hasRun ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{pendingTasks.length} tasks queued for analysis</p>
          {pendingTasks.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {formatDistanceToNow(new Date(t.deadline), { addSuffix: true })} · {t.estimatedHours}h · {t.priority} priority
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* AI Results */}
      <AnimatePresence>
        {prioritizeMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Strategy */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <TrendingUp className="h-4 w-4" /> Overall Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{prioritizeMutation.data.overallStrategy}</p>
              </CardContent>
            </Card>

            {/* Ranked Tasks */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Prioritized Order</p>
              {prioritizeMutation.data.tasks
                .sort((a, b) => a.rank - b.rank)
                .map((pt, i) => (
                  <motion.div
                    key={pt.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary font-bold text-sm"
                            data-testid={`rank-badge-${i + 1}`}
                          >
                            {pt.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground">{pt.title}</p>
                              <Badge className={`text-xs border ${urgencyColor(pt.urgency)}`}>{pt.urgency}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{pt.reasoning}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
