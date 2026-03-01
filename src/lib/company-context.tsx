"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Company {
  id: string;
  name: string;
}

interface CompanyContextValue {
  selectedCompany: Company | null;
  setSelectedCompany: (c: Company | null) => void;
  isSuper: boolean;
  userType: string | null;
  ready: boolean;
}

const CompanyContext = createContext<CompanyContextValue>({
  selectedCompany: null,
  setSelectedCompany: () => {},
  isSuper: false,
  userType: null,
  ready: false,
});

export function useCompany() {
  return useContext(CompanyContext);
}

const STORAGE_KEY = "smartlots_selected_company";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const setSelectedCompany = useCallback((c: Company | null) => {
    setSelectedCompanyState(c);
    if (c) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setReady(true);
        return;
      }
      supabase
        .from("users")
        .select("user_type, company_id, companies(id, name)")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (!data) {
            setReady(true);
            return;
          }
          setUserType(data.user_type);

          if (data.user_type === "SUPER_ADMIN") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try {
                setSelectedCompanyState(JSON.parse(stored));
              } catch {
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          } else {
            const co = data.companies as unknown as { id: string; name: string } | null;
            if (co) {
              setSelectedCompanyState({ id: co.id, name: co.name });
            }
          }
          setReady(true);
        });
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (userType === "SUPER_ADMIN" && !selectedCompany && pathname !== "/companies") {
      router.replace("/companies");
    }
  }, [ready, userType, selectedCompany, pathname, router]);

  return (
    <CompanyContext.Provider
      value={{ selectedCompany, setSelectedCompany, isSuper: userType === "SUPER_ADMIN", userType, ready }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
