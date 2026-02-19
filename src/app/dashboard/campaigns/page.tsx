"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Megaphone,
  Mail,
  Linkedin,
  Layers,
  Loader2,
  Info,
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

type Campaign = Tables<"campaigns">;
type CampaignType = "email" | "linkedin" | "multi_channel";
type CampaignStatus = "draft" | "active" | "paused" | "completed";

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
};

const TYPE_ICONS: Record<CampaignType, React.ElementType> = {
  email: Mail,
  linkedin: Linkedin,
  multi_channel: Layers,
};

const TYPE_LABELS: Record<CampaignType, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  multi_channel: "Multi-Channel",
};

function getNextStatus(current: CampaignStatus): CampaignStatus | null {
  const transitions: Record<CampaignStatus, CampaignStatus | null> = {
    draft: "active",
    active: "paused",
    paused: "active",
    completed: null,
  };
  return transitions[current];
}

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<CampaignType>("email");

  const supabase = createClient();

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user, fetchCampaigns]);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormType("email");
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormName(campaign.name);
    setFormDescription(campaign.description || "");
    setFormType((campaign.type as CampaignType) || "email");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !user) return;
    setSaving(true);

    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: formName.trim(),
      description: formDescription.trim() || null,
      type: formType,
      status: "draft" as CampaignStatus,
      settings: {},
    });

    if (!error) {
      setCreateDialogOpen(false);
      resetForm();
      await fetchCampaigns();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!selectedCampaign || !formName.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from("campaigns")
      .update({
        name: formName.trim(),
        description: formDescription.trim() || null,
        type: formType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedCampaign.id);

    if (!error) {
      setEditDialogOpen(false);
      setSelectedCampaign(null);
      resetForm();
      await fetchCampaigns();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    setSaving(true);

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", selectedCampaign.id);

    if (!error) {
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
      await fetchCampaigns();
    }
    setSaving(false);
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const nextStatus = getNextStatus(campaign.status);
    if (!nextStatus) return;

    const { error } = await supabase
      .from("campaigns")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    if (!error) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id ? { ...c, status: nextStatus } : c
        )
      );
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
      {/* Phase 2 Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <Info className="h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          Campaign execution coming in Phase 2. Set up your campaigns now.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campaigns</h2>
          <p className="mt-1 text-slate-500">
            Create and manage your outreach campaigns.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              Campaigns coming soon!
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first campaign to get started.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const campaignType = (campaign.type as CampaignType) || "email";
            const TypeIcon = TYPE_ICONS[campaignType];
            const nextStatus = getNextStatus(campaign.status);

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-100 p-2">
                        <TypeIcon className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {campaign.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            {TYPE_LABELS[campaignType]}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${STATUS_STYLES[campaign.status]}`}
                          >
                            {campaign.status}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {campaign.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {campaign.description}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/60">
                      No description
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  {nextStatus && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(campaign)}
                    >
                      {nextStatus === "active" ? (
                        <Play className="mr-1 h-3 w-3" />
                      ) : (
                        <Pause className="mr-1 h-3 w-3" />
                      )}
                      {nextStatus === "active" ? "Activate" : "Pause"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(campaign)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(campaign)}
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

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Set up a new outreach campaign. Execution will be available in Phase 2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Name</Label>
              <Input
                id="campaign-name"
                placeholder="Q1 Outreach Campaign"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                placeholder="Describe the goals and target audience for this campaign..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-type">Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as CampaignType)}>
                <SelectTrigger id="campaign-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="multi_channel">Multi-Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !formName.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your campaign details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-name">Name</Label>
              <Input
                id="edit-campaign-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-description">Description</Label>
              <Textarea
                id="edit-campaign-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-type">Type</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as CampaignType)}>
                <SelectTrigger id="edit-campaign-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="multi_channel">Multi-Channel</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedCampaign?.name}&rdquo;?
              This action cannot be undone.
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
