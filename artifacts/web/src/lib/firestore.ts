import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { auth } from "./firebase";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed";
  riskLevel: "low" | "medium" | "high" | "critical";
  createdAt: string;
}

const db = getFirestore();
const TASKS_COLLECTION = "tasks";

export async function createTask(task: Omit<Task, "id" | "createdAt" | "userId">) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    userId: auth.currentUser.uid,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getTasks() {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const q = query(collection(db, TASKS_COLLECTION), where("userId", "==", auth.currentUser.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await updateDoc(taskRef, updates);
}

export async function deleteTask(id: string) {
  const taskRef = doc(db, TASKS_COLLECTION, id);
  await deleteDoc(taskRef);
}
