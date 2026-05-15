import { RECORD_CLASS_NAME } from "@/parse";
import { useEffect, useReducer } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataStoreType } from "@/models";
import Papa from "papaparse";
import { DataStoreService } from "@/services/data-store.service";
import {
  AlertCircle,
  CheckCircle,
  Database,
  FileUp,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Parse from "@/parse";

// Centralized text for easy translation
const TEXT = {
  managerTitle: (name: string) => `${name} マネージャー`, // `${name} Manager`
  logout: "ログアウト", // Logout
  loadingData: "データを読み込み中...", // Loading data...
  totalObjects: (name: string) => `${name} オブジェクト合計`, // `Total ${name} Objects`
  failedToLoadData: "データの読み込みに失敗しました", // Failed to load data
  uploadingRecords: "レコードをアップロード中...", // Uploading records...
  progressLabel: (done: number, total: number) => `${done} / ${total}`, // `${done} of ${total}`
  uploadCompleteTitle: "アップロード完了", // Upload Complete
  previousAndNewCount: (prev: number, next: number) =>
    `前回の件数: ${prev} → 新しい件数: ${next}`, // `Previous count: ${prev} → New count: ${next}`
  errorTitle: "エラー", // Error
  uploadCsvFile: "CSVファイルをアップロード", // Upload CSV File
  uploading: "アップロード中...", // Uploading...
};

// Types
type Status =
  | "idle"
  | "loading"
  | "updating"
  | "deleting"
  | "success"
  | "error";

type State = {
  recordClassName: string;
  count: number | null;
  status: Status;
  error: string | null;
  previousCount: number | null;
  uploadProgress: number;
  uploadTotal: number;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: number }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPLOAD_START"; payload: number }
  | { type: "UPLOAD_PROGRESS_UPDATE"; payload: number }
  | { type: "UPLOAD_SUCCESS"; payload: number }
  | { type: "UPLOAD_ERROR"; payload: string }
  | { type: "DELETE_START" }
  | { type: "DELETE_SUCCESS" }
  | { type: "DELETE_ERROR"; payload: string };

const initialState: State = {
  recordClassName: RECORD_CLASS_NAME,
  count: null,
  status: "idle",
  error: null,
  previousCount: null,
  uploadProgress: 0,
  uploadTotal: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, status: "idle", count: action.payload };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.payload };
    case "UPLOAD_START":
      return {
        ...state,
        status: "updating",
        error: null,
        previousCount: state.count,
        uploadTotal: action.payload,
        uploadProgress: 0,
      };
    case "UPLOAD_PROGRESS_UPDATE":
      return { ...state, uploadProgress: action.payload };
    case "UPLOAD_SUCCESS":
      return {
        ...state,
        status: "success",
        count: action.payload,
        uploadProgress: state.uploadTotal,
      };
    case "UPLOAD_ERROR":
      return { ...state, status: "error", error: action.payload };
    case "DELETE_START":
      return { ...state, status: "deleting", error: null };
    case "DELETE_ERROR":
      return { ...state, status: "error", error: action.payload };
    case "DELETE_SUCCESS":
      return { ...state, status: "idle" };
    default:
      return state;
  }
}

export function Upload() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    fetchCount();
  }, []);

  const fetchCount = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const total = await DataStoreService.countRecords(state.recordClassName);
      dispatch({ type: "FETCH_SUCCESS", payload: total });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "FETCH_ERROR", payload: message });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = Papa.parse<DataStoreType>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        throw new Error("Error parsing CSV file");
      }
      const recordsData = parsed.data;

      // Delete existing records
      dispatch({ type: "DELETE_START" });
      try {
        await DataStoreService.deleteRecords(state.recordClassName);
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete records";
        dispatch({ type: "DELETE_ERROR", payload: message });
        return;
      }

      // Upload new records
      dispatch({ type: "UPLOAD_START", payload: recordsData.length });
      try {
        await DataStoreService.uploadRecords(
          state.recordClassName,
          recordsData,
          (progress: number) => {
            dispatch({
              type: "UPLOAD_PROGRESS_UPDATE",
              payload: progress,
            });
          }
        );
        dispatch({ type: "UPLOAD_SUCCESS", payload: recordsData.length });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload records";
        dispatch({ type: "UPLOAD_ERROR", payload: message });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process file";
      dispatch({ type: "UPLOAD_ERROR", payload: message });
    }

    // Reset the file input
    e.target.value = "";
  };

  async function handleLogout() {
    try {
      await Parse.User.logOut();
      window.location.reload();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  const isLoading = state.status === "loading";
  const isUpdating = state.status === "updating";
  const isDeleting = state.status === "deleting";
  const isProcessing = isLoading || isUpdating || isDeleting;
  const progressPercentage =
    state.uploadTotal > 0
      ? Math.round((state.uploadProgress / state.uploadTotal) * 100)
      : 0;

  return (
    <Card className="w-full max-w-md shadow-lg border-opacity-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>{TEXT.managerTitle(state.recordClassName)}</CardTitle>
          </div>
          <Button onClick={handleLogout}>{TEXT.logout}</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Status Display */}
        <div className="flex items-center justify-center h-24 rounded-lg bg-muted/50 border">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {TEXT.loadingData}
              </p>
            </div>
          ) : state.count !== null ? (
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">{state.count}</span>
              <span className="text-sm text-muted-foreground">
                {TEXT.totalObjects(state.recordClassName)}
              </span>
            </div>
          ) : state.error ? (
            <div className="flex flex-col items-center gap-1 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm">{TEXT.failedToLoadData}</span>
            </div>
          ) : null}
        </div>

        {/* Upload Progress */}
        {isUpdating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{TEXT.uploadingRecords}</span>
              <span>
                {TEXT.progressLabel(state.uploadProgress, state.uploadTotal)}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Success Message */}
        {state.status === "success" && (
          <Alert
            variant="default"
            className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900"
          >
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{TEXT.uploadCompleteTitle}</AlertTitle>
            <AlertDescription className="text-sm">
              {state.previousCount !== null &&
                TEXT.previousAndNewCount(state.previousCount, state.count!)}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {state.error && state.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{TEXT.errorTitle}</AlertTitle>
            <AlertDescription className="text-sm">
              {state.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={isProcessing}
          />
          <Button className="w-full" disabled={isProcessing} asChild>
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileUp className="h-4 w-4" />
              {isUpdating ? TEXT.uploading : TEXT.uploadCsvFile}
              {isDeleting && (
                <span className="ml-2">
                  <RefreshCw className="h-3 w-3 animate-spin inline-block" />
                </span>
              )}
            </label>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
