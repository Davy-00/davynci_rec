"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { HRNav } from "@/components/HRNav";
import { getToken, isTokenValid } from "@/lib/auth";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip auth check on the login/signup pages
    if (pathname === "/hr/login" || pathname === "/hr/signup") {
      setChecked(true);
      return;
    }
    const token = getToken();
    if (!isTokenValid(token)) {
      router.replace("/hr/login");
      return;
    }
    // Inject auth header for all axios requests while in HR layout
    const interceptor = axios.interceptors.request.use((config) => {
      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    });
    setChecked(true);
    return () => { axios.interceptors.request.eject(interceptor); };
  }, [pathname, router]);

  if (!checked) return null;

  // Render login/signup pages without HRNav
  if (pathname === "/hr/login" || pathname === "/hr/signup") return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      <HRNav />
      <main className="flex-1 dot-bg overflow-y-auto scrollbar-thin">
        {children}
      </main>
    </div>
  );
}
