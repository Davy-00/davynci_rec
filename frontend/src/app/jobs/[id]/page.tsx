"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OldJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => { if (id) router.replace(`/hr/jobs/${id}`); }, [id, router]);
  return null;
}
