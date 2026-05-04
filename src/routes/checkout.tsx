import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — BloodMC" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  username: z.string().trim().min(3, "Username too short").max(16, "Username too long").regex(/^[A-Za-z0-9_]+$/, "Invalid Minecraft username"),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
});
const genRef = () => "BMC-" + Math.random().toString(36).slice(2, 7).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();

function CheckoutPage() {
  const { items, currency, setCurrency, total, symbol, clear } = useCart();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    const parsed = schema.safeParse({ username, email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (items.length === 0) { toast.error("Cart is empty"); return; }
    setSubmitting(true);
    const order_ref = genRef();
    const { error } = await supabase.from("orders").insert({
      order_ref, minecraft_username: username, email: email || null, currency, total,
      items: items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, category: i.category, price: currency === "INR" ? i.price_inr : i.price_usd })),
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    clear();
    nav({ to: "/order-success", search: { ref: order_ref } });
  };

  return (
    <SiteLayout>
      <PageHeader eyebrow="Checkout" title="Complete your order" />
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/40 py-16 text-center text-muted-foreground">Your cart is empty.</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
              <div><Label htmlFor="username">Minecraft Username *</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Notch" maxLength={16} /><p className="mt-1 text-xs text-muted-foreground">Perks will be delivered to this account.</p></div>
              <div><Label htmlFor="email">Email (optional)</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} /></div>
              <div><Label>Currency</Label>
                <div className="mt-1 flex rounded-md border border-border overflow-hidden">
                  <Button type="button" size="sm" variant={currency === "INR" ? "default" : "ghost"} onClick={() => setCurrency("INR")} className="flex-1 rounded-none">INR ₹</Button>
                  <Button type="button" size="sm" variant={currency === "USD" ? "default" : "ghost"} onClick={() => setCurrency("USD")} className="flex-1 rounded-none">USD $</Button>
                </div>
              </div>
              {currency === "INR" ? (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
                  <p className="font-bold text-blood">UPI Payment</p>
                  <p className="mt-1">Pay <b>₹{total.toLocaleString("en-IN")}</b> to:</p>
                  <p className="mt-1 font-mono text-base">shadowroni@ybl</p>
                  <p className="mt-2 text-xs text-muted-foreground">After payment, open a Discord ticket with your Order ID.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground">For USD payments, contact us on Discord after creating the order.</div>
              )}
              <Button onClick={submit} disabled={submitting} className="w-full bg-blood shadow-blood">{submitting ? "Creating order..." : "Place Order"}</Button>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 h-fit">
              <h3 className="font-bold text-lg">Order Summary</h3>
              <ul className="mt-4 space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="flex justify-between text-sm">
                    <span><span className="text-muted-foreground uppercase text-[10px] mr-2">{it.category}</span>{it.name}</span>
                    <span>{symbol}{currency === "INR" ? Number(it.price_inr).toLocaleString("en-IN") : Number(it.price_usd).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-base font-bold"><span>Total</span><span className="text-blood">{symbol}{currency === "INR" ? total.toLocaleString("en-IN") : total.toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
