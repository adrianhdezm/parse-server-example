import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { FileStore } from "@/components/file-store";
import { Login } from "@/components/login";
import { Upload } from "@/components/upload";

export function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
        <Upload />
        <FileStore />
      </div>
    </div>
  );
}
