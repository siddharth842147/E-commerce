"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Send, CheckCircle2, Loader2 } from "lucide-react";

export function ContactFormClient() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [orderId, setOrderId] = React.useState("");
  const [subject, setSubject] = React.useState("Order Inquiry");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setIsSubmitting(true);

    // Simulate sending message or storing contact ticket
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Thank you! Your message has been received. Our team will respond within 24 business hours.");
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm flex flex-col items-center justify-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Message Sent Successfully!</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Thank you for getting in touch, <span className="font-semibold text-foreground">{name}</span>. A support ticket has been created and our team will get back to you at <span className="font-medium text-foreground">{email}</span> within 24 hours.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsSubmitted(false);
            setMessage("");
            setOrderId("");
          }}
          className="mt-2 text-xs"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactName" className="text-xs font-semibold">
            Your Name *
          </Label>
          <Input
            id="contactName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma"
            className="h-9 text-xs"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail" className="text-xs font-semibold">
            Email Address *
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aarav@example.com"
            className="h-9 text-xs"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone" className="text-xs font-semibold">
            Phone Number (Optional)
          </Label>
          <Input
            id="contactPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="h-9 text-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactOrder" className="text-xs font-semibold">
            Order ID (Optional)
          </Label>
          <Input
            id="contactOrder"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. #ORD-89234"
            className="h-9 text-xs font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contactSubject" className="text-xs font-semibold">
          Subject / Category
        </Label>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger id="contactSubject" className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Order Inquiry">Order Inquiry &amp; Tracking</SelectItem>
            <SelectItem value="Return & Refund">Returns, Replacements &amp; Refunds</SelectItem>
            <SelectItem value="Payment Issue">Payment &amp; Billing Assistance</SelectItem>
            <SelectItem value="Product Question">Product Specifications &amp; Stock</SelectItem>
            <SelectItem value="Feedback">Feedback &amp; Suggestions</SelectItem>
            <SelectItem value="Other">Other Query</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contactMessage" className="text-xs font-semibold">
          Message *
        </Label>
        <Textarea
          id="contactMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please describe how we can assist you in detail..."
          rows={4}
          className="text-xs leading-relaxed"
          required
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="gap-2 h-9 text-xs mt-2 w-full sm:w-auto self-end">
        {isSubmitting ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        <span>Send Message</span>
      </Button>
    </form>
  );
}
