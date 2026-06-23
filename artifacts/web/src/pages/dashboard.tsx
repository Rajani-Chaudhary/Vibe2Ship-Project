import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalyzeRisk } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { Task } from "@/lib/firestore";
import { formatDistanceToNow } from "date-fns";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function riskColor(level: string) {
  switch (level) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

function TaskRow({ task }: { task: Task }) {
  const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent/5 rounded-lg px-2 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`} · {task.estimatedHours}h estimated
        </p>
      </div>
      <Badge className={`text-xs border ${riskColor(task.riskLevel)} shrink-0`}>
        {task.riskLevel}
      </Badge>
      <div className="w-20 hidden sm:block">
        <Progress
          value={task.status === "completed" ? 100 : task.status === "in_progress" ? 50 : 0}
          className="h-1.5"
        />
      </div>
      <Link href={`/tasks/${task.id}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks();
  const riskMutation = useAnalyzeRisk();

  const total = tasks?.length ?? 0;
  const pending = tasks?.filter((t) => t.status !== "completed").length ?? 0;
  const completed = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const highRisk = tasks?.filter((t) => t.riskLevel === "high" || t.riskLevel === "critical").length ?? 0;
  const productivityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

  const topPendingTask = tasks?.find((t) => t.status !== "completed" && (t.priority === "critical" || t.priority === "high"));

  const stats = [
    { label: "Total Tasks", value: total, icon: ListTodo, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Completed", value: completed, icon: CheckSquare, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "High Risk", value: highRisk, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">
          {getGreeting()}, {user?.displayName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-muted-foreground mt-1">Here's your productivity overview for today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card/60 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!topPendingTask ? (
                <p className="text-muted-foreground text-sm">No urgent tasks. Keep it up!</p>
              ) : !riskMutation.data && !riskMutation.isPending ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground font-medium">"{topPendingTask.title}"</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDistanceToNow(new Date(topPendingTask.deadline), { addSuffix: true })}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-primary/40 hover:bg-primary/10"
                    onClick={() =>
                      riskMutation.mutate({
                        data: {
                          title: topPendingTask.title,
                          description: topPendingTask.description,
                          deadline: topPendingTask.deadline,
                          estimatedHours: topPendingTask.estimatedHours,
                          priority: topPendingTask.priority,
                          existingTaskCount: pending,
                        },
                      })
                    }
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    Analyze Risk
                  </Button>
                </div>
              ) : riskMutation.isPending ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="space-y-3">
                  <Badge className={`border ${riskColor(riskMutation.data.riskLevel)}`}>
                    {riskMutation.data.riskLevel} risk
                  </Badge>
                  <p className="text-sm text-foreground">{riskMutation.data.reason}</p>
                  <p className="text-xs text-primary font-medium">{riskMutation.data.suggestedAction}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Productivity Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Productivity Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-foreground">{productivityScore}</span>
                <span className="text-muted-foreground mb-1">/100</span>
              </div>
              <Progress value={productivityScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completed} of {total} tasks completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-start gap-2 border-border/50 hover:border-primary/40">
                  <Plus className="h-4 w-4 text-primary" /> Add New Task
                </Button>
              </Link>
              <Link href="/prioritize">
                <Button variant="outline" className="w-full justify-start gap-2 border-border/50 hover:border-primary/40">
                  <ListTodo className="h-4 w-4 text-primary" /> Prioritize Tasks
                </Button>
              </Link>
              <Link href="/assistant">
                <Button variant="outline" className="w-full justify-start gap-2 border-border/50 hover:border-primary/40">
                  <Sparkles className="h-4 w-4 text-primary" /> Ask AI Assistant
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Task List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Your Tasks</CardTitle>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !tasks?.length ? (
              <div className="text-center py-10 space-y-3">
                <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground text-sm">No tasks yet. Add your first task to get started.</p>
                <Link href="/tasks">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {tasks.slice(0, 6).map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
