import { DataStoreType } from "./models";

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

  static async deleteRecords(
    recordClassName: string,
    records: DataStoreType[],
    onProgress: (progress: number) => void
  ): Promise<void> {
    const DataStore = Parse.Object.extend(recordClassName);
    let completed = 0;
    for (const record of records) {
      const recordToDelete = new DataStore();
      recordToDelete.id = record.id;
      await recordToDelete.destroy();
      completed++;
      onProgress(completed);
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
