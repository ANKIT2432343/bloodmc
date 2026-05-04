import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

const KEYS = [
  "site_name", "tagline", "server_ip", "server_version",
  "discord_url", "youtube_url", "instagram_url",
  "upi_id", "upi_name",
  "support_email", "maintenance_mode", "announcement",
];

function SettingsAdmin() {
  const [values, setValues] = useState<Record<string, any>>({});

  const load = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    const map: Record<string, any> = {};
    (data ?? []).forEach((s: any) => { map[s.key] = s.value; });
    KEYS.forEach((k) => { if (!(k in map)) map[k] = k === "maintenance_mode" ? false : ""; });
    setValues(map);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const rows = KEYS.map((k) => ({ key: k, value: values[k] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const set = (k: string, v: any) => setValues({ ...values, [k]: v });

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-3xl font-bold">Settings</h1><p className="text-sm text-muted-foreground">Configure site, server, payments and socials.</p></div>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Site Name</Label><Input value={values.site_name || ""} onChange={(e) => set("site_name", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={values.tagline || ""} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div><Label>Server IP</Label><Input value={values.server_ip || ""} onChange={(e) => set("server_ip", e.target.value)} /></div>
          <div><Label>Server Version</Label><Input value={values.server_version || ""} onChange={(e) => set("server_version", e.target.value)} /></div>
          <div><Label>Discord URL</Label><Input value={values.discord_url || ""} onChange={(e) => set("discord_url", e.target.value)} /></div>
          <div><Label>YouTube URL</Label><Input value={values.youtube_url || ""} onChange={(e) => set("youtube_url", e.target.value)} /></div>
          <div><Label>Instagram URL</Label><Input value={values.instagram_url || ""} onChange={(e) => set("instagram_url", e.target.value)} /></div>
          <div><Label>Support Email</Label><Input value={values.support_email || ""} onChange={(e) => set("support_email", e.target.value)} /></div>
          <div><Label>UPI ID</Label><Input value={values.upi_id || ""} onChange={(e) => set("upi_id", e.target.value)} /></div>
          <div><Label>UPI Name</Label><Input value={values.upi_name || ""} onChange={(e) => set("upi_name", e.target.value)} /></div>
        </div>
        <div><Label>Announcement Banner</Label><Textarea rows={2} value={values.announcement || ""} onChange={(e) => set("announcement", e.target.value)} /></div>
        <label className="flex items-center gap-3"><Switch checked={!!values.maintenance_mode} onCheckedChange={(v) => set("maintenance_mode", v)} /><span>Maintenance Mode</span></label>
        <Button className="bg-blood shadow-blood" onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
}