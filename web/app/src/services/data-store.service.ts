import { DataStoreType } from "../models";
import Parse from "../parse";

export class DataStoreService {
  static async fetchAllData(
    recordClassName: string,
    recordProps: string[]
  ): Promise<DataStoreType[]> {
    const DataStore = Parse.Object.extend(recordClassName);
    const records = [];
    let hasMore = true;
    let skip = 0;
    const limit = 1000; // Número máximo por página

    while (hasMore) {
      const query = new Parse.Query(DataStore);
      query.limit(limit);
      query.skip(skip);
      const results = await query.find();

      records.push(...results);

      if (results.length < limit) {
        hasMore = false; // Ya no quedan más resultados
      } else {
        skip += limit; // Saltar a la siguiente página
      }
    }

    return records.map((record) => {
      const parsedRecord: Record<string, string> = {
        id: record.id || "",
        createdAt: record.createdAt?.toISOString() || "",
        updatedAt: record.updatedAt?.toISOString() || "",
      };
      recordProps.forEach((prop) => {
        parsedRecord[prop] = record.get(prop) || "";
      });
      return parsedRecord as unknown as DataStoreType;
    });
  }

  static async countRecords(recordClassName: string): Promise<number> {
    const query = new Parse.Query(recordClassName);
    const count = await query.count();
    return count;
  }

  static async deleteRecords(recordClassName: string): Promise<void> {
    const response = await Parse.Cloud.run("deleteAll", {
      className: recordClassName,
    });
    if (response && response.status === "success") {
      console.log(`All records in ${recordClassName} deleted successfully.`);
    } else {
      console.error(`Failed to delete records in ${recordClassName}.`);
    }
  }

  static async uploadRecords(
    recordClassName: string,
    recordsData: DataStoreType[],
    onProgress: (progress: number) => void
  ): Promise<void> {
    const DataStore = Parse.Object.extend(recordClassName);
    let completed = 0;
    for (const recordData of recordsData) {
      const record = new DataStore();
      Object.entries(recordData).forEach(([key, value]) => {
        if (key === "id") {
          record.set("ID", value);
        } else {
          record.set(key, value);
        }
      });
      await record.save();
      completed++;
      onProgress(completed);
    }
  }
}
