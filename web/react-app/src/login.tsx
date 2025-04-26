import { useState, FormEvent, useContext } from "react";
import Parse from "./parse";
import { AuthContext } from "./auth-context";

export function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { setCurrentUser } = useContext(AuthContext);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const user = await Parse.User.logIn(username, password);
      setCurrentUser(user); // update global auth state
      console.log("User logged in:", user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An error occurred during login.";
      setError(message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 border shadow p-6 rounded-lg">
      <form onSubmit={handleLogin}>
        <h2 className="text-xl font-semibold mb-4">Login</h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <input
          type="text"
          className="w-full border rounded p-2 mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full border rounded p-2 mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
}
