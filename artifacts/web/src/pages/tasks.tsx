import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { Task } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Plus, Search, Pencil, Trash2, ChevronRight, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function riskColor(level: string) {
  switch (level) {
    case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default: return "bg-green-500/20 text-green-400 border-green-500/30";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "in_progress": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

type TaskFormData = Omit<Task, "id" | "createdAt" | "userId">;
const emptyForm: TaskFormData = {
  title: "",
  description: "",
  deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
  estimatedHours: 2,
  priority: "medium",
  status: "pending",
  riskLevel: "low",
};

function TaskForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: TaskFormData;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<TaskFormData>(initial);
  const set = (k: keyof TaskFormData, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input data-testid="input-task-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="What needs to be done?" className="bg-background/50" />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea data-testid="input-task-description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Any details..." className="bg-background/50 resize-none" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Deadline</Label>
          <Input data-testid="input-task-deadline" type="date" value={form.deadline.split("T")[0]} onChange={(e) => set("deadline", e.target.value)} className="bg-background/50" />
        </div>
        <div className="space-y-1">
          <Label>Estimated Hours</Label>
          <Input data-testid="input-task-hours" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(e) => set("estimatedHours", parseFloat(e.target.value))} className="bg-background/50" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
            <SelectTrigger data-testid="select-task-priority" className="bg-background/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger data-testid="select-task-status" className="bg-background/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button data-testid="button-submit-task" onClick={() => onSubmit(form)} disabled={!form.title.trim() || loading} className="bg-primary hover:bg-primary/90">
          {loading ? "Saving..." : "Save Task"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = (tasks ?? []).filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchRisk = filterRisk === "all" || t.riskLevel === filterRisk;
    return matchSearch && matchStatus && matchRisk;
  });

  const handleCreate = (data: TaskFormData) => {
    createTask.mutate(data, { onSuccess: () => setDialogOpen(false) });
  };

  const handleUpdate = (data: TaskFormData) => {
    if (!editTask) return;
    updateTask.mutate({ id: editTask.id, updates: data }, { onSuccess: () => setEditTask(null) });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks?.length ?? 0} total tasks</p>
        </div>
        <Button data-testid="button-add-task" onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input data-testid="input-search-tasks" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger data-testid="select-filter-status" className="w-36 bg-card/60 border-border/50">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger data-testid="select-filter-risk" className="w-36 bg-card/60 border-border/50">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">No tasks found.</p>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> Add your first task
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((task, i) => {
              const daysLeft = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
              const progress = task.status === "completed" ? 100 : task.status === "in_progress" ? 50 : 0;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                  data-testid={`card-task-${task.id}`}
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                            <Badge className={`text-xs border ${riskColor(task.riskLevel)}`}>{task.riskLevel}</Badge>
                            <Badge className={`text-xs border ${statusColor(task.status)}`}>{task.status.replace("_", " ")}</Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Due {daysLeft <= 0 ? "overdue" : `in ${daysLeft}d`}</span>
                            <span>{task.estimatedHours}h estimated</span>
                            <span className="capitalize">{task.priority} priority</span>
                          </div>
                          <div className="mt-2">
                            <Progress value={progress} className="h-1" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button data-testid={`button-edit-task-${task.id}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditTask(task)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button data-testid={`button-delete-task-${task.id}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(task.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/tasks/${task.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm initial={emptyForm} onSubmit={handleCreate} onCancel={() => setDialogOpen(false)} loading={createTask.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editTask && (
            <TaskForm initial={editTask} onSubmit={handleUpdate} onCancel={() => setEditTask(null)} loading={updateTask.isPending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) deleteTask.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
