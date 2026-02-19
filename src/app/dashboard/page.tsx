"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GitBranch,
  MessageSquare,
  Puzzle,
  Plus,
  MessageCircle,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalContacts: number;
  activeWorkflows: number;
  conversations: number;
  components: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    activeWorkflows: 0,
    conversations: 0,
    components: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient();

      const [contactsRes, workflowsRes, conversationsRes, componentsRes] =
        await Promise.all([
          supabase.from("contacts").select("*", { count: "exact", head: true }),
          supabase
            .from("workflows")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("conversations")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("custom_components")
            .select("*", { count: "exact", head: true }),
        ]);

      setStats({
        totalContacts: contactsRes.count ?? 0,
        activeWorkflows: workflowsRes.count ?? 0,
        conversations: conversationsRes.count ?? 0,
        components: componentsRes.count ?? 0,
      });
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  const statCards = [
    {
      label: "Total Contacts",
      count: stats.totalContacts,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Workflows",
      count: stats.activeWorkflows,
      icon: GitBranch,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Conversations",
      count: stats.conversations,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Components",
      count: stats.components,
      icon: Puzzle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {displayName}
        </h2>
        <p className="mt-1 text-slate-500">
          Here is an overview of your GTM engine.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {card.label}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {card.count}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/dashboard/contacts")}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/chat")}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Start Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/workflows")}
          >
            <Workflow className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
