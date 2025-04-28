// src/components/DataStore.tsx
import { useEffect, useReducer, ChangeEvent } from "react";
import Parse from "./parse";
import Papa from "papaparse";
import { DataStoreType } from "./models";

type StatusType = "idle" | "loading" | "updating" | "success" | "error";
const RECORD_CLASS_NAME = "DataStore";
const RECORD_PROPERTIES =
  "company1, no1, company, tel0, tel1, tel2, tel3, tel, id3, no, mail1, zip1, zip, address1, URL, XML, longitude, latitude, ido, mail, ID, address, keido, lat, lon, geolocation, active, hp1, map, hp0, hp, id1, id2, hpmail1, hpmail2, hpmail, program1, program, download, com2, com";

interface DataStoreState {
  records: DataStoreType[];
  recordClassName: string;
  recordProps: string[];
  status: StatusType;
  error: string;
  uploadProgress: number;
  uploadTotal: number;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "UPDATE_START"; payload: number }
  | { type: "FETCH_SUCCESS"; payload: DataStoreType[] }
  | { type: "UPDATE_SUCCESS"; payload: DataStoreType[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_ERROR"; payload: string }
  | { type: "UPLOAD_PROGRESS_UPDATE"; payload: number };

// Reducer
function dataStoreReducer(
  state: DataStoreState,
  action: Action
): DataStoreState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: "" };
    case "UPDATE_START":
      return {
        ...state,
        status: "updating",
        error: "",
        uploadProgress: 0,
        uploadTotal: action.payload,
      };
    case "UPLOAD_PROGRESS_UPDATE":
      return { ...state, uploadProgress: action.payload };
    case "FETCH_SUCCESS":
      return {
        ...state,
        records: action.payload,
        status: "idle",
        error: "",
        uploadProgress: 0,
        uploadTotal: 0,
      };
    case "UPDATE_SUCCESS":
      return {
        ...state,
        records: action.payload,
        status: "success",
        error: "",
        uploadProgress: 100,
        uploadTotal: action.payload.length,
      };
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
    recordClassName: RECORD_CLASS_NAME,
    recordProps: RECORD_PROPERTIES.split(",").map((prop) => prop.trim()),
    status: "idle",
    error: "",
    uploadProgress: 0,
    uploadTotal: 0,
  });

  useEffect(() => {
    fetchDataStore();
  }, []);

  async function fetchDataStore() {
    dispatch({ type: "FETCH_START" });
    try {
      const DataStore = Parse.Object.extend(state.recordClassName);
      const query = new Parse.Query(DataStore);
      const results = await query.find();

      const parsedRecords: DataStoreType[] = results.map((record) => {
        const parsedRecord: Record<string, string> = {
          id: record.id || "",
          createdAt: record.createdAt?.toISOString() || "",
          updatedAt: record.updatedAt?.toISOString() || "",
        };
        state.recordProps.forEach((prop) => {
          parsedRecord[prop] = record.get(prop) || "";
        });
        return parsedRecord as unknown as DataStoreType;
      });

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
      const DataStore = Parse.Object.extend(state.recordClassName);
      const query = new Parse.Query(DataStore);
      const existingRecords = await query.find();
      const deletePromises = existingRecords.map((record) => record.destroy());
      await Promise.all(deletePromises);

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0) {
        throw new Error("Error parsing CSV file");
      }

      const recordsData = parsed.data as DataStoreType[];

      dispatch({ type: "UPDATE_START", payload: recordsData.length });

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
        dispatch({
          type: "UPLOAD_PROGRESS_UPDATE",
          payload: completed,
        });
      }

      dispatch({ type: "UPDATE_SUCCESS", payload: recordsData });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload records";
      dispatch({ type: "UPDATE_ERROR", payload: message });
    }
  }

  const { records, status, error } = state;

  const updateProgressPercent = Math.round(
    (state.uploadProgress / state.uploadTotal) * 100
  );

  async function handleLogout() {
    try {
      await Parse.User.logOut();
      window.location.reload(); // Puedes hacer window.location.href = '/login' si tienes rutas
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-7xl h-screen mx-auto mt-10 p-6 flex flex-col items-center justify-center gap-4">
        <div className="text-center mt-10">Loading records...</div>
      </div>
    );
  }

  if (status === "updating") {
    return (
      <div className="max-w-7xl h-screen mx-auto mt-10 p-6 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center w-2xl">
          <span>Uploading</span>
          <div className="w-12 ml-1">{updateProgressPercent} %</div>
          <span className="ml-2">(</span>
          <div className="w-11 flex justify-end">{state.uploadProgress}</div>
          <span className="mx-2">/</span>
          <div className="w-12">{state.uploadTotal}</div>
          <span>) objects</span>
        </div>
        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-4"
            style={{ width: `${updateProgressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-7xl h-screen mx-auto mt-10 p-6 flex flex-col items-center justify-center gap-2">
        <div className="text-center text-red-500 mt-10">{error}</div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="max-w-7xl h-screen mx-auto mt-10 p-6 flex flex-col items-center justify-center gap-2">
        <div className="text-green-600 text-xl font-semibold">
          ✅ {state.records.length} Records uploaded successfully!
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
