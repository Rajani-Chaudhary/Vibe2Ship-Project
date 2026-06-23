import { useParams, useLocation } from "wouter";
import { useTask } from "@/hooks/use-tasks";
import { useAnalyzeRisk, useGenerateBreakdown, useGenerateRescuePlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle, Clock, Loader2, Zap, ListChecks } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function riskColor(level: string) {
  switch (level) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

function priorityColor(p: string) {
  switch (p) {
    case "critical": return "text-red-400";
    case "high": return "text-orange-400";
    case "medium": return "text-yellow-400";
    default: return "text-green-400";
  }
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: task, isLoading } = useTask(id ?? "");

  const riskMutation = useAnalyzeRisk();
  const breakdownMutation = useGenerateBreakdown();
  const rescueMutation = useGenerateRescuePlan();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-muted-foreground">Task not found.</p>
        <Button onClick={() => setLocation("/tasks")} variant="outline">Back to Tasks</Button>
      </div>
    );
  }

  const isRescueNeeded = task.riskLevel === "high" || task.riskLevel === "critical";
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tasks")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Task Detail</p>
        </div>
      </div>

      {/* Task Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={`border ${riskColor(task.riskLevel)}`}>{task.riskLevel} risk</Badge>
              <Badge variant="outline" className={`${priorityColor(task.priority)} border-current/30`}>{task.priority} priority</Badge>
              <Badge variant="outline" className="border-border/50">{task.status.replace("_", " ")}</Badge>
            </div>
            {task.description && <p className="text-muted-foreground text-sm">{task.description}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                <p className="text-sm font-medium text-foreground">
                  {daysLeft <= 0 ? <span className="text-red-400">Overdue</span> : `${daysLeft} days left`}
                </p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estimated Effort</p>
                <p className="text-sm font-medium text-foreground">{task.estimatedHours} hours</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium text-foreground">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rescue Mode Banner */}
      <AnimatePresence>
        {isRescueNeeded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/50 to-orange-950/30 p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-300 text-lg">Rescue Mode</h3>
                <p className="text-red-400/80 text-sm mt-0.5">This task is at {task.riskLevel} risk. Generate an emergency plan now.</p>
              </div>
            </div>
            {!rescueMutation.data && !rescueMutation.isPending && (
              <Button
                data-testid="button-generate-rescue"
                onClick={() => rescueMutation.mutate({ data: { title: task.title, description: task.description, deadline: task.deadline, estimatedHours: task.estimatedHours } })}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Zap className="h-4 w-4 mr-2" /> Generate Rescue Plan
              </Button>
            )}
            {rescueMutation.isPending && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating your rescue plan...
              </div>
            )}
            {rescueMutation.data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <p className="text-red-300 font-medium text-sm">{rescueMutation.data.urgencyMessage}</p>
                <div className="space-y-2">
                  {rescueMutation.data.sessions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 bg-red-950/40 rounded-lg p-3"
                    >
                      <div className="w-16 shrink-0 text-xs font-mono text-red-300 font-semibold pt-0.5">{s.time}</div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">{s.activity}</p>
                        {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{s.durationMinutes}m</div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span className="text-red-300">Est. completion: <strong>{rescueMutation.data.estimatedCompletionTime}</strong></span>
                </div>
                {rescueMutation.data.focusTips && (
                  <p className="text-xs text-muted-foreground italic">{rescueMutation.data.focusTips}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Analysis */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!riskMutation.data && !riskMutation.isPending && (
              <Button
                data-testid="button-analyze-risk"
                variant="outline"
                size="sm"
                className="border-primary/40 hover:bg-primary/10"
                onClick={() => riskMutation.mutate({ data: { title: task.title, description: task.description, deadline: task.deadline, estimatedHours: task.estimatedHours, priority: task.priority } })}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" /> Analyze Risk
              </Button>
            )}
            {riskMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
              </div>
            )}
            {riskMutation.data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className={`border ${riskColor(riskMutation.data.riskLevel)}`}>{riskMutation.data.riskLevel}</Badge>
                  <div className="flex-1 bg-muted/30 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                      style={{ width: `${riskMutation.data.riskScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{riskMutation.data.riskScore}/100</span>
                </div>
                <p className="text-sm text-foreground">{riskMutation.data.reason}</p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary font-medium">{riskMutation.data.suggestedAction}</p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Task Breakdown */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> AI Task Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!breakdownMutation.data && !breakdownMutation.isPending && (
              <Button
                data-testid="button-generate-breakdown"
                variant="outline"
                size="sm"
                className="border-primary/40 hover:bg-primary/10"
                onClick={() => breakdownMutation.mutate({ data: { title: task.title, description: task.description, estimatedHours: task.estimatedHours } })}
              >
                <ListChecks className="h-3.5 w-3.5 mr-2" /> Generate Breakdown
              </Button>
            )}
            {breakdownMutation.isPending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Breaking it down...
              </div>
            )}
            {breakdownMutation.data && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="relative pl-6 space-y-0">
                  {breakdownMutation.data.subtasks.map((sub, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="relative"
                    >
                      {/* Timeline line */}
                      {i < breakdownMutation.data.subtasks.length - 1 && (
                        <div className="absolute left-[-18px] top-7 bottom-0 w-px bg-primary/20" />
                      )}
                      {/* Timeline dot */}
                      <div className="absolute left-[-24px] top-3 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                      <div className="bg-muted/20 rounded-lg p-3 mb-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-primary font-mono font-bold">Step {sub.order}</span>
                          <span className="text-xs text-muted-foreground">{sub.estimatedMinutes}m</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{sub.title}</p>
                        {sub.description && <p className="text-xs text-muted-foreground mt-1">{sub.description}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                  Total: {Math.floor(breakdownMutation.data.totalEstimatedMinutes / 60)}h {breakdownMutation.data.totalEstimatedMinutes % 60}m
                  {breakdownMutation.data.tips && <span className="ml-2 italic">{breakdownMutation.data.tips}</span>}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
