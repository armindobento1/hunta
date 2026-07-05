import { useParams } from "react-router-dom";

import { KillEditor } from "@/components/kills/kill-editor";

export function EditKillPage() {
  const { killId } = useParams<{ killId: string }>();
  return <KillEditor killId={killId} />;
}
