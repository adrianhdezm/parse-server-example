import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { Login } from "./login";
import CustomerList from "./customer-list";

export function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Login />;
  }

  return <CustomerList />;
}
