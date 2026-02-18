"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, OrgMember } from "@/types/organization";

interface OrgContextValue {
  org: Organization | null;
  member: OrgMember | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue>({
  org: null,
  member: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrgMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrgData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setOrg(null);
        setMember(null);
        setLoading(false);
        return;
      }

      // Find the user's org membership
      const { data: memberData, error: memberError } = await supabase
        .from("org_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (memberError || !memberData) {
        // User exists but has no org membership — might be mid-signup
        setOrg(null);
        setMember(null);
        setLoading(false);
        return;
      }

      setMember(memberData as OrgMember);

      // Load the organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", memberData.org_id)
        .single();

      if (orgError || !orgData) {
        setError("Failed to load organization data");
        setLoading(false);
        return;
      }

      setOrg(orgData as Organization);
    } catch {
      setError("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgData();
  }, [loadOrgData]);

  return (
    <OrgContext.Provider
      value={{ org, member, loading, error, refresh: loadOrgData }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
