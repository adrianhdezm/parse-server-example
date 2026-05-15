import { FileStoreRecord } from "@/models";
import Parse, { FILE_STORE_CLASS_NAME } from "@/parse";

export type FileStoreStats = {
  success: true;
  filesDir: string;
  parseFileCount: number;
  physicalFileCount: number;
  totalBytes: number;
  orphanOnDiskCount: number;
  missingOnDiskCount: number;
};

type DeleteBeforeDateResponse = {
  success: true;
  deletedRecords: number;
  deletedFiles: number;
  filesDir: string;
  date: string;
};

const toUtcStartOfDayIso = (dateOnly: string): string => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
};

export class FileStoreService {
  static async fetchStats(): Promise<FileStoreStats> {
    return Parse.Cloud.run("getFileStoreStats");
  }

  static async fetchAllData(): Promise<FileStoreRecord[]> {
    const FileStore = Parse.Object.extend(FILE_STORE_CLASS_NAME);
    const records: Parse.Object[] = [];
    let hasMore = true;
    let skip = 0;
    const limit = 1000;

    while (hasMore) {
      const query = new Parse.Query(FileStore);
      query.limit(limit);
      query.skip(skip);
      query.ascending("createdAt");
      const results = await query.find();
      records.push(...results);

      if (results.length < limit) {
        hasMore = false;
      } else {
        skip += limit;
      }
    }

    return records.map((record) => {
      const json = record.toJSON() as Record<string, unknown>;
      const normalized: FileStoreRecord = {
        ...json,
        id: record.id || "",
        createdAt: record.createdAt?.toISOString() || "",
        updatedAt: record.updatedAt?.toISOString() || "",
      };
      delete (normalized as { objectId?: string }).objectId;
      return normalized;
    });
  }

  static async deleteRecordsBeforeDate(
    beforeDate: string
  ): Promise<DeleteBeforeDateResponse> {
    return Parse.Cloud.run("deleteFileStoreBeforeDate", {
      date: toUtcStartOfDayIso(beforeDate),
    });
  }
}
