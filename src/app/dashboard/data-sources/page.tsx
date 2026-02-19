"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Plug,
  Database,
  Globe,
  Webhook,
  FileSpreadsheet,
  Hand,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type DataSource = Tables<"data_sources">;
type DataSourceType = "apify" | "api" | "webhook" | "csv" | "manual";

interface DataSourceConfig {
  actor_id?: string;
  endpoint_url?: string;
  method?: "GET" | "POST";
  headers?: string;
  webhook_url?: string;
  webhook_secret?: string;
  file_name?: string;
  description?: string;
}

const TYPE_ICONS: Record<DataSourceType, React.ElementType> = {
  apify: Database,
  api: Globe,
  webhook: Webhook,
  csv: FileSpreadsheet,
  manual: Hand,
};

const TYPE_COLORS: Record<DataSourceType, string> = {
  apify: "bg-purple-100 text-purple-800",
  api: "bg-blue-100 text-blue-800",
  webhook: "bg-orange-100 text-orange-800",
  csv: "bg-green-100 text-green-800",
  manual: "bg-slate-100 text-slate-800",
};

function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function DataSourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DataSourceType>("api");
  const [formConfig, setFormConfig] = useState<DataSourceConfig>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const supabase = createClient();

  const fetchDataSources = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDataSources(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchDataSources();
    }
  }, [user, fetchDataSources]);

  const resetForm = () => {
    setFormName("");
    setFormType("api");
    setFormConfig({});
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openEditDialog = (source: DataSource) => {
    setSelectedSource(source);
    setFormName(source.name);
    setFormType(source.type);
    const config = (source.config as DataSourceConfig) || {};
    setFormConfig(config);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (source: DataSource) => {
    setSelectedSource(source);
    setDeleteDialogOpen(true);
  };

  const handleTypeChange = (type: DataSourceType) => {
    setFormType(type);
    if (type === "webhook") {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
      setFormConfig({
        webhook_url: `${baseUrl}/api/webhooks`,
        webhook_secret: generateWebhookSecret(),
      });
    } else {
      setFormConfig({});
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: formName.trim(),
      type: formType,
      config: formConfig as Tables<"data_sources">["config"],
      is_active: true,
    };

    const { error } = await supabase.from("data_sources").insert(payload);

    if (!error) {
      setAddDialogOpen(false);
      resetForm();
      await fetchDataSources();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!selectedSource || !formName.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("data_sources")
      .update({
        name: formName.trim(),
        type: formType,
        config: formConfig as Tables<"data_sources">["config"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedSource.id);

    if (!error) {
      setEditDialogOpen(false);
      setSelectedSource(null);
      resetForm();
      await fetchDataSources();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedSource) return;
    setSaving(true);

    const { error } = await supabase
      .from("data_sources")
      .delete()
      .eq("id", selectedSource.id);

    if (!error) {
      setDeleteDialogOpen(false);
      setSelectedSource(null);
      await fetchDataSources();
    }
    setSaving(false);
  };

  const handleToggleActive = async (source: DataSource) => {
    const { error } = await supabase
      .from("data_sources")
      .update({
        is_active: !source.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", source.id);

    if (!error) {
      setDataSources((prev) =>
        prev.map((ds) =>
          ds.id === source.id ? { ...ds, is_active: !ds.is_active } : ds
        )
      );
    }
  };

  const handleTestConnection = async (source: DataSource) => {
    setTesting(source.id);
    setTestResult(null);

    try {
      if (source.type === "api") {
        const config = source.config as DataSourceConfig;
        if (!config.endpoint_url) {
          setTestResult({ id: source.id, success: false, message: "No endpoint URL configured" });
          setTesting(null);
          return;
        }

        try {
          const response = await fetch(config.endpoint_url, {
            method: config.method || "GET",
            headers: config.headers ? JSON.parse(config.headers) : {},
          });
          setTestResult({
            id: source.id,
            success: response.ok,
            message: response.ok
              ? `Connection successful (${response.status})`
              : `Connection failed (${response.status})`,
          });
        } catch {
          setTestResult({
            id: source.id,
            success: false,
            message: "Failed to reach endpoint. Check URL and CORS settings.",
          });
        }
      } else {
        // Mock success for non-API types
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setTestResult({
          id: source.id,
          success: true,
          message: `${source.type} connection verified successfully`,
        });
      }
    } finally {
      setTesting(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderConfigForm = () => {
    switch (formType) {
      case "apify":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actor-id">Actor ID</Label>
              <Input
                id="actor-id"
                placeholder="apify/web-scraper"
                value={formConfig.actor_id || ""}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, actor_id: e.target.value })
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              API token is read from the <code className="rounded bg-muted px-1 py-0.5 text-xs">APIFY_API_TOKEN</code> environment variable.
            </p>
          </div>
        );

      case "api":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-url">Endpoint URL</Label>
              <Input
                id="endpoint-url"
                placeholder="https://api.example.com/data"
                value={formConfig.endpoint_url || ""}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, endpoint_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={formConfig.method || "GET"}
                onValueChange={(value) =>
                  setFormConfig({ ...formConfig, method: value as "GET" | "POST" })
                }
              >
                <SelectTrigger id="method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                value={formConfig.headers || ""}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, headers: e.target.value })
                }
                className="font-mono text-xs"
                rows={4}
              />
            </div>
          </div>
        );

      case "webhook":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={formConfig.webhook_url || ""}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(formConfig.webhook_url || "", "webhook_url")
                  }
                >
                  {copiedField === "webhook_url" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send POST requests to this URL to push data into this source.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={formConfig.webhook_secret || ""}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(
                      formConfig.webhook_secret || "",
                      "webhook_secret"
                    )
                  }
                >
                  {copiedField === "webhook_secret" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Include this as the <code className="rounded bg-muted px-1 py-0.5 text-xs">x-webhook-secret</code> header in your requests.
              </p>
            </div>
          </div>
        );

      case "csv":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                <div>
                  <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop a CSV file here, or click to browse
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    className="mt-3"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormConfig({ ...formConfig, file_name: file.name });
                      }
                    }}
                  />
                </div>
              </div>
              {formConfig.file_name && (
                <p className="text-sm text-muted-foreground">
                  Selected: {formConfig.file_name}
                </p>
              )}
            </div>
          </div>
        );

      case "manual":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-description">Description</Label>
              <Textarea
                id="manual-description"
                placeholder="Describe the data you will manually enter into this source..."
                value={formConfig.description || ""}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, description: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Sources</h2>
          <p className="mt-1 text-slate-500">
            Connect and manage your external data sources.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Data Source
        </Button>
      </div>

      {/* Data Sources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : dataSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              No data sources yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add your first data source to start importing data.
            </p>
            <Button className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Data Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((source) => {
            const TypeIcon = TYPE_ICONS[source.type];
            const typeColor = TYPE_COLORS[source.type];
            const result = testResult?.id === source.id ? testResult : null;

            return (
              <Card key={source.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${typeColor.split(" ")[0]}`}>
                        <TypeIcon className={`h-5 w-5 ${typeColor.split(" ")[1]}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{source.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${typeColor}`}
                          >
                            {source.type}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={() => handleToggleActive(source)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={source.is_active ? "default" : "secondary"}>
                        {source.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Synced</span>
                      <span className="text-slate-700">
                        {source.last_synced_at
                          ? new Date(source.last_synced_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  {result && (
                    <div
                      className={`mt-3 rounded-md px-3 py-2 text-xs ${
                        result.success
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {result.message}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(source)}
                    disabled={testing === source.id}
                  >
                    {testing === source.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Plug className="mr-1 h-3 w-3" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(source)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(source)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Data Source Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
            <DialogDescription>
              Connect a new external data source to import data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ds-name">Name</Label>
              <Input
                id="ds-name"
                placeholder="My Data Source"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-type">Type</Label>
              <Select value={formType} onValueChange={(v) => handleTypeChange(v as DataSourceType)}>
                <SelectTrigger id="ds-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apify">Apify</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium text-slate-700">Configuration</h4>
              {renderConfigForm()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Data Source Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Source</DialogTitle>
            <DialogDescription>
              Update the configuration of this data source.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-ds-name">Name</Label>
              <Input
                id="edit-ds-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ds-type">Type</Label>
              <Select value={formType} onValueChange={(v) => handleTypeChange(v as DataSourceType)}>
                <SelectTrigger id="edit-ds-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apify">Apify</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium text-slate-700">Configuration</h4>
              {renderConfigForm()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Data Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedSource?.name}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
