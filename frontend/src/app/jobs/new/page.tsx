"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldNewJobPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/hr/jobs/new"); }, [router]);
  return null;
}
