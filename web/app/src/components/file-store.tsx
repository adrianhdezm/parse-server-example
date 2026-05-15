import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { FileStoreRecord } from "@/models";
import { FileStoreService, type FileStoreStats } from "@/services/file-store.service";
import { AlertCircle, CheckCircle, FileSearch, Trash2 } from "lucide-react";

const TEXT = {
  managerTitle: "File Store マネージャー", // File Store Manager
  fetchAll: "すべてのデータを取得", // Fetch all data
  fetching: "取得中...", // Fetching...
  parseFileCount: (count: number) => `_File レコード数: ${count}`,
  physicalFileCount: (count: number) => `ディスク上の物理ファイル数: ${count}`,
  orphanFileCount: (count: number) => `検出された孤立ファイル数: ${count}`,
  totalStorageUsed: (size: string) => `使用容量: ${size}`, // Used storage: size
  deleteBeforeTitle: "指定日より前のレコードとファイルを削除", // Delete records/files before date
  datePlaceholder: "YYYY-MM-DD",
  deleteAction: "削除する", // Delete
  deleting: "削除中...", // Deleting...
  recordsFetched: (count: number) => `取得件数: ${count}`, // Records fetched: count
  previewTitle: "最新5件プレビュー", // Latest 5 preview
  deleteSuccessTitle: "削除完了", // Delete complete
  deleteSuccessMessage: (
    records: number,
    files: number,
    path: string
  ) => `削除したレコード: ${records} / 削除したファイル: ${files} (${path})`,
  errorTitle: "エラー", // Error
  invalidDate: "日付は YYYY-MM-DD 形式で入力してください。",
};

type DeleteResult = {
  deletedRecords: number;
  deletedFiles: number;
  filesDir: string;
};

const normalizeDateToIsoDate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsedDate = new Date(trimmed);
  if (Number.isNaN(parsedDate.getTime())) {
    return trimmed;
  }

  return parsedDate.toISOString().slice(0, 10);
};

const isValidDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const [, yearString, monthString, dayString] = match;
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);
  const day = Number.parseInt(dayString, 10);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

const SIZE_KEYS = ["size", "fileSize", "filesize", "bytes"] as const;

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const getRecordSizeInBytes = (record: FileStoreRecord): number => {
  for (const key of SIZE_KEYS) {
    const value = record[key];
    const parsed = toNumber(value);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  const precision = value >= 10 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
};

export function FileStore() {
  const [records, setRecords] = useState<FileStoreRecord[]>([]);
  const [stats, setStats] = useState<FileStoreStats | null>(null);
  const [dateValue, setDateValue] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);

  const handleFetch = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const [data, statsData] = await Promise.all([
        FileStoreService.fetchAllData(),
        FileStoreService.fetchStats(),
      ]);
      setRecords(data);
      setStats(statsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      setError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDelete = async () => {
    const normalizedDate = normalizeDateToIsoDate(dateValue);
    if (!isValidDate(normalizedDate)) {
      setError(TEXT.invalidDate);
      return;
    }
    setIsDeleting(true);
    setError(null);
    setDeleteResult(null);
    try {
      const result = await FileStoreService.deleteRecordsBeforeDate(normalizedDate);
      setDeleteResult({
        deletedRecords: result.deletedRecords,
        deletedFiles: result.deletedFiles,
        filesDir: result.filesDir,
      });
      await handleFetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete records";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const previewRecords = records.slice(-5).reverse();
  const totalStorageUsedInBytes =
    stats?.totalBytes ??
    records.reduce((sum, record) => sum + getRecordSizeInBytes(record), 0);
  const formattedStorageUsed = formatBytes(totalStorageUsedInBytes);

  return (
    <Card className="w-full max-w-md shadow-lg border-opacity-50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          <CardTitle>{TEXT.managerTitle}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground space-y-1">
              <div>{TEXT.recordsFetched(records.length)}</div>
              <div>{TEXT.parseFileCount(stats?.parseFileCount ?? records.length)}</div>
              <div>{TEXT.physicalFileCount(stats?.physicalFileCount ?? 0)}</div>
              <div>{TEXT.orphanFileCount(stats?.orphanOnDiskCount ?? 0)}</div>
              <div>{TEXT.totalStorageUsed(formattedStorageUsed)}</div>
            </div>
            <Button onClick={handleFetch} disabled={isFetching || isDeleting}>
              {isFetching ? TEXT.fetching : TEXT.fetchAll}
            </Button>
          </div>
        </div>

        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
          <div className="text-sm font-semibold">{TEXT.deleteBeforeTitle}</div>
          <div className="flex flex-col gap-2">
            <Input
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              placeholder={TEXT.datePlaceholder}
              disabled={isDeleting}
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isFetching}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? TEXT.deleting : TEXT.deleteAction}
            </Button>
          </div>
        </div>

        {deleteResult && (
          <Alert
            variant="default"
            className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{TEXT.deleteSuccessTitle}</AlertTitle>
            <AlertDescription className="text-sm">
              {TEXT.deleteSuccessMessage(
                deleteResult.deletedRecords,
                deleteResult.deletedFiles,
                deleteResult.filesDir
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{TEXT.errorTitle}</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {records.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">{TEXT.previewTitle}</div>
            <div className="max-h-48 overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
              {previewRecords.map((record) => (
                <pre
                  key={record.id}
                  className="whitespace-pre-wrap break-words mb-2 last:mb-0"
                >
                  {JSON.stringify(record, null, 2)}
                </pre>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2" />
    </Card>
  );
}
