import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Zap, Clock, ShieldAlert, BrainCircuit, Activity } from "lucide-react";

export default function Landing() {
  const features = [
    { icon: ShieldAlert, title: "AI Deadline Prediction", desc: "Know which tasks are at risk before they become emergencies." },
    { icon: Zap, title: "Smart Prioritization", desc: "Let AI organize your workload based on urgency and impact." },
    { icon: BrainCircuit, title: "AI Task Breakdown", desc: "Turn overwhelming projects into bite-sized actionable steps." },
    { icon: Clock, title: "Rescue Mode", desc: "Generate an hour-by-hour survival plan for critical deadlines." },
    { icon: Activity, title: "Productivity Insights", desc: "Track your completion rate and optimize your working habits." },
    { icon: Bot, title: "AI Assistant", desc: "Chat with your personal productivity coach for tailored advice." }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Bot className="h-6 w-6 text-primary" />
            <span>Life Saver</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
          >
            Stop Missing Deadlines <br/> Before They Become Emergencies
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            An AI productivity companion that predicts deadline risks, prioritizes work, and creates personalized action plans.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8">
                View Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mockup Preview */}
      <section className="px-4 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-primary/10"
        >
          <div className="h-12 bg-muted/50 border-b border-border/50 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="aspect-[16/9] bg-background/50 p-8 flex items-center justify-center text-muted-foreground">
            {/* Abstract visual representing dashboard */}
            <div className="w-full h-full flex gap-6">
              <div className="w-1/4 space-y-4">
                <div className="h-24 rounded-lg bg-card border border-border" />
                <div className="h-64 rounded-lg bg-card border border-border" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex gap-4">
                  {[1,2,3].map(i => <div key={i} className="flex-1 h-32 rounded-lg bg-card border border-border" />)}
                </div>
                <div className="h-full rounded-lg bg-card border border-border flex flex-col p-6 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-md bg-muted/50 w-full" />)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to survive.</h2>
            <p className="text-xl text-muted-foreground">Advanced AI tools built for high-stakes workloads.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-8 relative">
            <div className="hidden sm:block absolute top-6 left-[10%] right-[10%] h-[2px] bg-border z-0" />
            {["Add Task", "AI Analyzes Risk", "Get Action Plan", "Meet Deadlines"].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-lg shadow-primary/20">
                  {i + 1}
                </div>
                <h4 className="font-bold text-lg">{step}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control of your time?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of high-performers crushing their goals.</p>
          <Link href="/signup">
            <Button size="lg" className="text-lg h-14 px-10">Start Your Free Mission</Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
