import { useState, FormEvent, useContext } from "react";
import Parse from "../parse";
import { AuthContext } from "../auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Text constants for translation
const TEXT = {
  pageTitle: "ログイン", // Login
  pageDescription: "アカウントにアクセスするために認証情報を入力してください", // Enter your credentials to access your account
  form: {
    username: {
      label: "ユーザー名", // Username
      placeholder: "ユーザー名を入力してください", // Enter your username
    },
    password: {
      label: "パスワード", // Password
      placeholder: "パスワードを入力してください", // Enter your password
    },
    forgotPassword: "パスワードをお忘れですか？", // Forgot password?
    submitButton: "ログイン", // Login
    loggingIn: "ログイン中...", // Logging in...
  },
  footer: {
    noAccount: "アカウントをお持ちでないですか？", // Don't have an account?
    signUp: "サインアップ", // Sign up
  },
  errors: {
    invalidCredentials: "ユーザー名またはパスワードが正しくありません。", // Invalid username or password.
    unknown: "不明なエラーが発生しました。", // An unknown error occurred.
  },
};

export function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setCurrentUser } = useContext(AuthContext);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = (await Parse.User.logIn(
        username,
        password
      )) as unknown as Parse.User<Parse.Attributes> | null;
      if (!user) {
        throw new Error(TEXT.errors.invalidCredentials);
      }
      setCurrentUser(user); // update global auth state
      console.log("User logged in:", user);
    } catch (err) {
      const message = err instanceof Error ? err.message : TEXT.errors.unknown;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg border-opacity-50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{TEXT.pageTitle}</CardTitle>
          <CardDescription>{TEXT.pageDescription}</CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{TEXT.form.username.label}</Label>
              <Input
                id="username"
                type="text"
                placeholder={TEXT.form.username.placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{TEXT.form.password.label}</Label>
              <Input
                id="password"
                type="password"
                placeholder={TEXT.form.password.placeholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-10">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {TEXT.form.loggingIn}
                </>
              ) : (
                TEXT.form.submitButton
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
