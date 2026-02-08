"use client";

import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const notifications = [
  {
    icon: Mail,
    title: "Email Notifications",
    description: "Booking confirmations, itinerary changes, and receipts",
    enabled: true,
  },
  {
    icon: MessageSquare,
    title: "SMS Alerts",
    description: "Flight delays, gate changes, and cancellation alerts",
    enabled: false,
  },
  {
    icon: Smartphone,
    title: "Push Notifications",
    description: "Real-time updates on your mobile device",
    enabled: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in duration-300 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your notification preferences and account settings.
      </p>

      <div className="mt-6 max-w-2xl space-y-6">
        <Card className="border-white/10 bg-white/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    item.enabled
                      ? "border-green-500/20 bg-green-500/10 text-green-400"
                      : "border-white/10 text-muted-foreground"
                  }
                >
                  {item.enabled ? "Active" : "Coming soon"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
