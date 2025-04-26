import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { Login } from "./login";

export function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <Login />;
  }

  return <h1 className="text-3xl font-bold underline">Hello world!</h1>;
}
