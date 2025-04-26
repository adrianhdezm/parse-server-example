import React, { createContext, useEffect, useState, ReactNode } from "react";
import Parse from "./parse";

interface AuthContextType {
  currentUser: Parse.User<Parse.Attributes> | null;
  setCurrentUser: React.Dispatch<
    React.SetStateAction<Parse.User<Parse.Attributes> | null>
  >;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] =
    useState<Parse.User<Parse.Attributes> | null>(null);

  useEffect(() => {
    const user = Parse.User.current() as Parse.User<Parse.Attributes> | null;
    setCurrentUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
