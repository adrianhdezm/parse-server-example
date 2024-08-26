import { useCallback, useState } from "react";
import { LoginForm } from "./login-form";
import { parseLogin } from "./parse-service";
import { UploadForm } from "./upload-form";

export const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);

  const handleLogin = useCallback(
    async (credentials) => {
      // Here you can perform your login logic,
      const isAuthenticated = await parseLogin(
        credentials.username,
        credentials.password
      );
      if (isAuthenticated) {
        setLoggedIn(true);
        setUsername(credentials.username);
      } else {
        // set login form error
      }
    },
    [setUsername, setLoggedIn]
  );

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setUsername(null);
  }, [setUsername, setLoggedIn]);

  const handleFileUpload = (file) => {
    console.log('File selected:', file.name);
    // You can handle the file upload logic here, e.g., upload to a server
  };
 

  return (
    <div>
      {loggedIn && username ? (
        <div>
          <h2>Welcome, {username}!</h2>
          <button onClick={handleLogout}>Logout</button>
          <h1>CSV File Upload </h1>
          <UploadForm onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
};
