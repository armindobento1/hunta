"use client";

import { useParams } from "next/navigation";

import { KillEditor } from "@/components/kills/kill-editor";

export default function EditKillPage() {
  const { killId } = useParams<{ killId: string }>();
  return <KillEditor killId={killId} />;
}
