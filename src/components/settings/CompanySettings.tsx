"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserPreferences {
  // Company
  company_name: string;
  company_website: string;
  company_description: string;
  company_size: string;
  founding_year: string;
  headquarters_location: string;
  industry: string;
  target_market: string;
  // Product
  product_service_description: string;
  unique_value_proposition: string;
  pricing_model: string;
  // ICP
  icp_job_titles: string[];
  icp_industries: string[];
  icp_company_sizes: string[];
  icp_geographic_regions: string[];
  icp_pain_points: string;
  icp_goals: string;
  icp_budget_range: string;
  // Sales
  sales_cycle_length: string;
  main_competitors: string;
  key_differentiators: string;
  preferred_tone: string;
  custom_instructions: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  company_name: "",
  company_website: "",
  company_description: "",
  company_size: "",
  founding_year: "",
  headquarters_location: "",
  industry: "",
  target_market: "",
  product_service_description: "",
  unique_value_proposition: "",
  pricing_model: "",
  icp_job_titles: [],
  icp_industries: [],
  icp_company_sizes: [],
  icp_geographic_regions: [],
  icp_pain_points: "",
  icp_goals: "",
  icp_budget_range: "",
  sales_cycle_length: "",
  main_competitors: "",
  key_differentiators: "",
  preferred_tone: "",
  custom_instructions: "",
};

// ---------------------------------------------------------------------------
// Multi-value input (badges)
// ---------------------------------------------------------------------------

function MultiValueInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addValue = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValue();
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addValue} className="h-9 px-3">
          <Plus className="mr-1 size-4" />
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((value, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              {value}
              <button
                type="button"
                onClick={() => removeValue(index)}
                className="hover:bg-muted ml-0.5 rounded-full p-0.5"
              >
                <X className="size-3" />
                <span className="sr-only">Remove {value}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CompanySettings() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---- Fetch preferences on mount ----
  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // Row not found -- upsert a default row
        const { data: inserted } = await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, ...DEFAULT_PREFERENCES, founding_year: null }, { onConflict: "user_id" })
          .select()
          .single();

        if (inserted) {
          applyServerData(inserted);
        }
      } else if (data) {
        applyServerData(data);
      }

      setLoading(false);
    };

    fetchPreferences();
  }, []);

  // Map server row into local state (handles possible null values)
  const applyServerData = (row: Record<string, unknown>) => {
    setPreferences({
      company_name: (row.company_name as string) ?? "",
      company_website: (row.company_website as string) ?? "",
      company_description: (row.company_description as string) ?? "",
      company_size: (row.company_size as string) ?? "",
      founding_year: row.founding_year != null ? String(row.founding_year) : "",
      headquarters_location: (row.headquarters_location as string) ?? "",
      industry: (row.industry as string) ?? "",
      target_market: (row.target_market as string) ?? "",
      product_service_description: (row.product_service_description as string) ?? "",
      unique_value_proposition: (row.unique_value_proposition as string) ?? "",
      pricing_model: (row.pricing_model as string) ?? "",
      icp_job_titles: (row.icp_job_titles as string[]) ?? [],
      icp_industries: (row.icp_industries as string[]) ?? [],
      icp_company_sizes: (row.icp_company_sizes as string[]) ?? [],
      icp_geographic_regions: (row.icp_geographic_regions as string[]) ?? [],
      icp_pain_points: (row.icp_pain_points as string) ?? "",
      icp_goals: (row.icp_goals as string) ?? "",
      icp_budget_range: (row.icp_budget_range as string) ?? "",
      sales_cycle_length: (row.sales_cycle_length as string) ?? "",
      main_competitors: (row.main_competitors as string) ?? "",
      key_differentiators: (row.key_differentiators as string) ?? "",
      preferred_tone: (row.preferred_tone as string) ?? "",
      custom_instructions: (row.custom_instructions as string) ?? "",
    });
  };

  // ---- Save preferences ----
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSuccessMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          ...preferences,
          founding_year: preferences.founding_year
            ? Number(preferences.founding_year)
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Failed to save preferences:", error);
    } else {
      setSuccessMessage("Settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setSaving(false);
  }, [preferences]);

  // ---- Helper to update a single field ----
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted h-9 w-full animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="icp">ICP</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Tab 1 - Company                                                  */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic details about your company that help the AI understand your
                business context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={preferences.company_name}
                    onChange={(e) => update("company_name", e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    value={preferences.company_website}
                    onChange={(e) => update("company_website", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_description">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={preferences.company_description}
                  onChange={(e) => update("company_description", e.target.value)}
                  placeholder="Briefly describe what your company does..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={preferences.company_size}
                    onValueChange={(v) => update("company_size", v)}
                  >
                    <SelectTrigger id="company_size" className="w-full">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founding_year">Founding Year</Label>
                  <Input
                    id="founding_year"
                    type="number"
                    value={preferences.founding_year}
                    onChange={(e) => update("founding_year", e.target.value)}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="headquarters_location">Headquarters Location</Label>
                  <Input
                    id="headquarters_location"
                    value={preferences.headquarters_location}
                    onChange={(e) => update("headquarters_location", e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={preferences.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    placeholder="SaaS / Technology"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_market">Target Market</Label>
                <Input
                  id="target_market"
                  value={preferences.target_market}
                  onChange={(e) => update("target_market", e.target.value)}
                  placeholder="B2B mid-market companies"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Tab 2 - Product                                                  */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>Product / Service</CardTitle>
              <CardDescription>
                Describe your offering so the AI can craft targeted messaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_service_description">
                  Product / Service Description
                </Label>
                <Textarea
                  id="product_service_description"
                  value={preferences.product_service_description}
                  onChange={(e) =>
                    update("product_service_description", e.target.value)
                  }
                  placeholder="Describe your main product or service..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unique_value_proposition">
                  Unique Value Proposition
                </Label>
                <Textarea
                  id="unique_value_proposition"
                  value={preferences.unique_value_proposition}
                  onChange={(e) =>
                    update("unique_value_proposition", e.target.value)
                  }
                  placeholder="What makes your product unique?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricing_model">Pricing Model</Label>
                <Select
                  value={preferences.pricing_model}
                  onValueChange={(v) => update("pricing_model", v)}
                >
                  <SelectTrigger id="pricing_model" className="w-full">
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="one-time">One-Time</SelectItem>
                    <SelectItem value="usage-based">Usage-Based</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Tab 3 - ICP                                                      */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="icp">
          <Card>
            <CardHeader>
              <CardTitle>Ideal Customer Profile</CardTitle>
              <CardDescription>
                Define who your ideal customers are so the AI can help you find
                and engage them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MultiValueInput
                label="Job Titles"
                values={preferences.icp_job_titles}
                onChange={(v) => update("icp_job_titles", v)}
                placeholder="e.g. VP of Sales"
              />

              <MultiValueInput
                label="Industries"
                values={preferences.icp_industries}
                onChange={(v) => update("icp_industries", v)}
                placeholder="e.g. FinTech"
              />

              <MultiValueInput
                label="Company Sizes"
                values={preferences.icp_company_sizes}
                onChange={(v) => update("icp_company_sizes", v)}
                placeholder="e.g. 51-200"
              />

              <MultiValueInput
                label="Geographic Regions"
                values={preferences.icp_geographic_regions}
                onChange={(v) => update("icp_geographic_regions", v)}
                placeholder="e.g. North America"
              />

              <div className="space-y-2">
                <Label htmlFor="icp_pain_points">Pain Points</Label>
                <Textarea
                  id="icp_pain_points"
                  value={preferences.icp_pain_points}
                  onChange={(e) => update("icp_pain_points", e.target.value)}
                  placeholder="What problems do your ideal customers face?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icp_goals">Goals</Label>
                <Textarea
                  id="icp_goals"
                  value={preferences.icp_goals}
                  onChange={(e) => update("icp_goals", e.target.value)}
                  placeholder="What are your ideal customers trying to achieve?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icp_budget_range">Budget Range</Label>
                <Input
                  id="icp_budget_range"
                  value={preferences.icp_budget_range}
                  onChange={(e) => update("icp_budget_range", e.target.value)}
                  placeholder="e.g. $5k-$50k / year"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Tab 4 - Sales                                                    */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales & Messaging</CardTitle>
              <CardDescription>
                Configure your sales context and preferred AI communication
                style.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sales_cycle_length">Sales Cycle Length</Label>
                <Select
                  value={preferences.sales_cycle_length}
                  onValueChange={(v) => update("sales_cycle_length", v)}
                >
                  <SelectTrigger id="sales_cycle_length" className="w-full">
                    <SelectValue placeholder="Select cycle length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1 week">&lt;1 week</SelectItem>
                    <SelectItem value="1-4 weeks">1-4 weeks</SelectItem>
                    <SelectItem value="1-3 months">1-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6+ months">6+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_competitors">Main Competitors</Label>
                <Textarea
                  id="main_competitors"
                  value={preferences.main_competitors}
                  onChange={(e) => update("main_competitors", e.target.value)}
                  placeholder="List your main competitors..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_differentiators">Key Differentiators</Label>
                <Textarea
                  id="key_differentiators"
                  value={preferences.key_differentiators}
                  onChange={(e) => update("key_differentiators", e.target.value)}
                  placeholder="What sets you apart from the competition?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_tone">Preferred Tone</Label>
                <Select
                  value={preferences.preferred_tone}
                  onValueChange={(v) => update("preferred_tone", v)}
                >
                  <SelectTrigger id="preferred_tone" className="w-full">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_instructions">
                  Additional Instructions for AI Assistant
                </Label>
                <Textarea
                  id="custom_instructions"
                  value={preferences.custom_instructions}
                  onChange={(e) => update("custom_instructions", e.target.value)}
                  placeholder="Any extra context or rules the AI should follow..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Save bar ---- */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {successMessage && (
          <span className="text-sm font-medium text-green-600">
            {successMessage}
          </span>
        )}
      </div>
    </div>
  );
}
