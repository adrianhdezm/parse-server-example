// src/components/CustomerList.tsx
import { useEffect, useReducer, ChangeEvent } from "react";
import Parse from "./parse";
import Papa from "papaparse";

// Types
interface CustomerType {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

type StatusType = "idle" | "loading" | "updating" | "success" | "error";

interface CustomerListState {
  customers: CustomerType[];
  status: StatusType;
  error: string;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "UPDATE_START" }
  | { type: "FETCH_SUCCESS"; payload: CustomerType[] }
  | { type: "UPDATE_SUCCESS"; payload: CustomerType[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "UPDATE_ERROR"; payload: string };

// Reducer
function customerListReducer(
  state: CustomerListState,
  action: Action
): CustomerListState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: "" };
    case "UPDATE_START":
      return { ...state, status: "updating", error: "" };
    case "FETCH_SUCCESS":
      return { customers: action.payload, status: "idle", error: "" };
    case "UPDATE_SUCCESS":
      return { customers: action.payload, status: "success", error: "" };
    case "FETCH_ERROR":
    case "UPDATE_ERROR":
      return { ...state, status: "error", error: action.payload };
    default:
      return state;
  }
}

// Component
export default function CustomerList() {
  const [state, dispatch] = useReducer(customerListReducer, {
    customers: [],
    status: "idle",
    error: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    dispatch({ type: "FETCH_START" });
    try {
      const Customer = Parse.Object.extend("Customer");
      const query = new Parse.Query(Customer);
      const results = await query.find();

      const parsedCustomers: CustomerType[] = results.map((customer) => ({
        id: customer._getId(),
        firstName: customer.get("firstName"),
        lastName: customer.get("lastName"),
        email: customer.get("email"),
        createdAt: customer.createdAt?.toISOString() || "",
        updatedAt: customer.updatedAt?.toISOString() || "",
      }));

      dispatch({ type: "FETCH_SUCCESS", payload: parsedCustomers });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers";
      dispatch({ type: "FETCH_ERROR", payload: message });
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      dispatch({ type: "UPDATE_START" });

      const Customer = Parse.Object.extend("Customer");
      const query = new Parse.Query(Customer);
      const existingCustomers = await query.find();
      const deletePromises = existingCustomers.map((customer) =>
        customer.destroy()
      );
      await Promise.all(deletePromises);

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      if (parsed.errors.length > 0) {
        throw new Error("Error parsing CSV file");
      }

      const customersData = parsed.data as {
        firstName: string;
        lastName: string;
        email: string;
      }[];

      const savePromises = customersData.map(async (data) => {
        const customer = new Customer();
        customer.set("firstName", data.firstName);
        customer.set("lastName", data.lastName);
        customer.set("email", data.email);
        return customer.save();
      });

      await Promise.all(savePromises);

      const freshCustomers = await new Parse.Query(Customer).find();
      const parsedCustomers: CustomerType[] = freshCustomers.map(
        (customer) => ({
          id: customer._getId(),
          firstName: customer.get("firstName"),
          lastName: customer.get("lastName"),
          email: customer.get("email"),
          createdAt: customer.createdAt?.toISOString() || "",
          updatedAt: customer.updatedAt?.toISOString() || "",
        })
      );

      dispatch({ type: "UPDATE_SUCCESS", payload: parsedCustomers });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload customers";
      dispatch({ type: "UPDATE_ERROR", payload: message });
    }
  }

  const { customers, status, error } = state;

  if (status === "loading") {
    return <div className="text-center mt-10">Loading customers...</div>;
  }

  if (status === "updating") {
    return (
      <div className="text-center mt-10">
        Uploading CSV and updating customers...
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
          ✅ Customers uploaded successfully!
        </div>
        <button
          onClick={fetchCustomers}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Go Back to Customer List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-semibold mb-4">Customers</h2>

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
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">First Name</th>
            <th className="border p-2">Last Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Created At</th>
            <th className="border p-2">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="text-center">
              <td className="border p-2">{customer.id}</td>
              <td className="border p-2">{customer.firstName}</td>
              <td className="border p-2">{customer.lastName}</td>
              <td className="border p-2">{customer.email}</td>
              <td className="border p-2">
                {new Date(customer.createdAt).toLocaleDateString()}{" "}
                {new Date(customer.createdAt).toLocaleTimeString()}
              </td>
              <td className="border p-2">
                {new Date(customer.updatedAt).toLocaleDateString()}{" "}
                {new Date(customer.updatedAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
