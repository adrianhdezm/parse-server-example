import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { Login } from "@/components/login";
import { Upload } from "@/components/upload";

export function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Login />;
  }

  return <Upload />;
}
