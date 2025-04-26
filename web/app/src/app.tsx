import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { Login } from "./login";
import DataStore from "./data-store";

export function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Login />;
  }

  return <DataStore />;
}
