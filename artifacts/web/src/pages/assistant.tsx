import { useState, useRef, useEffect } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useAiChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What should I focus on right now?",
  "Help me prioritize my tasks for today",
  "Create a study plan for my deadlines",
  "I'm feeling overwhelmed, what should I do?",
];

export default function Assistant() {
  const { data: tasks } = useTasks();
  const chatMutation = useAiChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [useTaskContext, setUseTaskContext] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const buildTaskContext = () => {
    if (!tasks?.length) return null;
    const pending = tasks.filter((t) => t.status !== "completed");
    if (!pending.length) return null;
    return pending
      .map((t) => {
        const days = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86400000);
        return `- "${t.title}": due in ${days}d, ${t.estimatedHours}h estimated, ${t.priority} priority, ${t.riskLevel} risk`;
      })
      .join("\n");
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");

    chatMutation.mutate(
      {
        data: {
          messages: updated,
          taskContext: useTaskContext ? buildTaskContext() : null,
        },
      },
      {
        onSuccess: (res) => {
          setMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your personal productivity coach.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="task-context"
            checked={useTaskContext}
            onCheckedChange={setUseTaskContext}
            data-testid="toggle-task-context"
          />
          <Label htmlFor="task-context" className="text-xs text-muted-foreground cursor-pointer">
            Task context
          </Label>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<React.ComponentRef<typeof ScrollArea>>}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-foreground font-medium">How can I help you today?</p>
                <p className="text-muted-foreground text-sm">Ask me anything about your deadlines and tasks.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    data-testid={`starter-prompt-${prompt.slice(0, 20)}`}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.role}-${i}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/40 text-foreground border border-border/50 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {chatMutation.isPending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/40 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-card/60">
          <div className="flex gap-2 items-end">
            <Textarea
              data-testid="input-chat-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
              className="resize-none bg-background/50 border-border/50 min-h-[44px] max-h-32 text-sm"
              rows={1}
            />
            <Button
              data-testid="button-send-message"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
              className="bg-primary hover:bg-primary/90 shrink-0 h-11 w-11"
            >
              {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
