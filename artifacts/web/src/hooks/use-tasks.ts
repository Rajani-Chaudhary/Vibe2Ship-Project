import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask, deleteTask, Task } from "../lib/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./use-toast";

export function useTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.uid],
    queryFn: () => getTasks(),
    enabled: !!user,
  });
}

export function useTask(id: string) {
  const { data: tasks } = useTasks();
  return {
    data: tasks?.find((t) => t.id === id),
    isLoading: !tasks
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (task: Omit<Task, "id" | "createdAt" | "userId">) => createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.uid] });
      toast({ title: "Task created successfully" });
    },
    onError: (err) => {
      toast({ title: "Failed to create task", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.uid] });
      toast({ title: "Task updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Failed to update task", description: err.message, variant: "destructive" });
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.uid] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Failed to delete task", description: err.message, variant: "destructive" });
    }
  });
}
