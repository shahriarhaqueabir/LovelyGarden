import { useEffect, useState } from "react";
import {
  getSyncStatusSnapshot,
  subscribeToSyncStatus,
  type SyncStatusSnapshot,
} from "../services/syncStatusService";

export const useSyncStatus = (): SyncStatusSnapshot => {
  const [status, setStatus] = useState(getSyncStatusSnapshot);

  useEffect(() => subscribeToSyncStatus(setStatus), []);

  return status;
};
