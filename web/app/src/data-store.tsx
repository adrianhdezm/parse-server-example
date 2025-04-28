// src/components/DataStore.tsx
import { useEffect, useReducer, ChangeEvent } from "react";
import Parse from "./parse";
import Papa from "papaparse";
import { DataStoreType } from "./models";

type StatusType = "idle" | "loading" | "updating" | "success" | "error";

interface DataStoreState {
  records: DataStoreType[];
  status: StatusType;
  error: string;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "UPDATE_START" }
  | { type: "FETCH_SUCCESS"; payload: DataStoreType[] }
  | { type: "UPDATE_SUCCESS"; payload: DataStoreType[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_ERROR"; payload: string };

// Reducer
function dataStoreReducer(
  state: DataStoreState,
  action: Action
): DataStoreState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: "" };
    case "UPDATE_START":
      return { ...state, status: "updating", error: "" };
    case "FETCH_SUCCESS":
      return { records: action.payload, status: "idle", error: "" };
    case "UPDATE_SUCCESS":
      return { records: action.payload, status: "success", error: "" };
    case "FETCH_ERROR":
    case "UPDATE_ERROR":
      return { ...state, status: "error", error: action.payload };
    default:
      return state;
  }
}

// Component
export default function DataStore() {
  const [state, dispatch] = useReducer(dataStoreReducer, {
    records: [],
    status: "idle",
    error: "",
  });

  useEffect(() => {
    fetchDataStore();
  }, []);

  async function fetchDataStore() {
    dispatch({ type: "FETCH_START" });
    try {
      const DataStore = Parse.Object.extend("DataStore");
      const query = new Parse.Query(DataStore);
      const results = await query.find();

      const parsedRecords: DataStoreType[] = results.map((record) => ({
        id: record.id || "",
        createdAt: record.createdAt?.toISOString() || "",
        updatedAt: record.updatedAt?.toISOString() || "",
        company1: record.get("company1") || "",
        no1: record.get("no1") || "",
        company: record.get("company") || "",
        tel0: record.get("tel0") || "",
        tel1: record.get("tel1") || "",
        tel2: record.get("tel2") || "",
        tel3: record.get("tel3") || "",
        tel: record.get("tel") || "",
        id3: record.get("id3") || "",
        no: record.get("no") || "",
        mail1: record.get("mail1") || "",
        zip1: record.get("zip1") || "",
        zip: record.get("zip") || "",
        address1: record.get("address1") || "",
        URL: record.get("URL") || "",
        XML: record.get("XML") || "",
        longitude: record.get("longitude") || "",
        latitude: record.get("latitude") || "",
        ido: record.get("ido") || "",
        mail: record.get("mail") || "",
        ID: record.get("ID") || "",
        address: record.get("address") || "",
        keido: record.get("keido") || "",
        lat: record.get("lat") || "",
        lon: record.get("lon") || "",
        geolocation: record.get("geolocation") || "",
        active: record.get("active") || "",
        hp1: record.get("hp1") || "",
        map: record.get("map") || "",
        hp0: record.get("hp0") || "",
        hp: record.get("hp") || "",
        id1: record.get("id1") || "",
        id2: record.get("id2") || "",
        hpmail1: record.get("hpmail1") || "",
        hpmail2: record.get("hpmail2") || "",
        hpmail: record.get("hpmail") || "",
        program1: record.get("program1") || "",
        program: record.get("program") || "",
        download: record.get("download") || "",
        com2: record.get("com2") || "",
        com: record.get("com") || "",
      }));

      dispatch({ type: "FETCH_SUCCESS", payload: parsedRecords });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load records";
      dispatch({ type: "FETCH_ERROR", payload: message });
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      dispatch({ type: "UPDATE_START" });

      const DataStore = Parse.Object.extend("DataStore");
      const query = new Parse.Query(DataStore);
      const existingRecords = await query.find();
      const deletePromises = existingRecords.map((record) => record.destroy());
      await Promise.all(deletePromises);

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0) {
        throw new Error("Error parsing CSV file");
      }

      const recordsData = parsed.data as Record<string, string>[];

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
      }

      await fetchDataStore();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload records";
      dispatch({ type: "UPDATE_ERROR", payload: message });
    }
  }

  const { records, status, error } = state;

  if (status === "loading") {
    return <div className="text-center mt-10">Loading records...</div>;
  }

  if (status === "updating") {
    return (
      <div className="text-center mt-10">
        Uploading CSV and updating records...
      </div>
    );
  }

  if (status === "error") {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  if (status === "success") {
    return (
      <div className="text-center mt-10 space-y-4">
        <div className="text-green-600 text-xl font-semibold">
          ✅ Records uploaded successfully!
        </div>
        <button
          onClick={fetchDataStore}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Go Back to Record List
        </button>
      </div>
    );
  }

  async function handleLogout() {
    try {
      await Parse.User.logOut();
      window.location.reload(); // Puedes hacer window.location.href = '/login' si tienes rutas
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <div className="max-w-7xl mx-auto mt-10 p-6">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold mb-6">DataStore Records</h2>
        <button
          onClick={handleLogout}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </header>

      {/* Upload CSV */}
      <div className="mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
          "
        />
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(records[0] || {}).map((key) => (
                <th key={key} className="border p-2 text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="text-center h-12">
                {Object.values(record).map((value, idx) => (
                  <td
                    key={idx}
                    className="border p-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]"
                    title={value as string} // Para mostrar tooltip completo al pasar el mouse
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
