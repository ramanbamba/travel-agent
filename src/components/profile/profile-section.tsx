"use client";

import { Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileSectionProps {
  title: string;
  editing: boolean;
  saving?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

export function ProfileSection({
  title,
  editing,
  saving,
  onEdit,
  onCancel,
  onSave,
  children,
}: ProfileSectionProps) {
  return (
    <Card className="border-white/10 bg-white/[0.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {editing ? (
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="h-7 gap-1 text-xs"
            >
              <X className="h-3 w-3" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="h-7 gap-1 text-xs"
            >
              <Check className="h-3 w-3" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 gap-1 text-xs text-muted-foreground"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
