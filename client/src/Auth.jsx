
import { useState } from "react";
import "./Auth.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Auth({ onLogin }) {
  const [loginRole, setLoginRole] = useState("citizen");
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function chooseRole(role) {
    setLoginRole(role);
    setIsLogin(true);
    setError("");
    setPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const body = isLogin
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      // Never allow login through the wrong role option.
      if (isLogin && data.user?.role !== loginRole) {
        throw new Error(
          `This account is not registered as a ${loginRole}. Please choose the correct login option.`
        );
      }

      // Public registration creates citizen accounts only.
      if (!isLogin && data.user?.role !== "citizen") {
        throw new Error("Citizen registration could not be verified.");
      }

      onLogin(data);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-icon">R</div>

        <h1>RoadCare</h1>
        <p className="auth-subtitle">
          Pothole Detection & Road Maintenance System
        </p>

        <h2>Choose your account</h2>

        <div className="auth-tabs">
          <button
            type="button"
            className={
              loginRole === "citizen"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() => chooseRole("citizen")}
          >
            Login as Citizen
          </button>

          <button
            type="button"
            className={
              loginRole === "officer"
                ? "auth-tab active"
                : "auth-tab"
            }
            onClick={() => chooseRole("officer")}
          >
            Login as Officer
          </button>
        </div>

        <h2>
          {isLogin
            ? `Welcome, ${loginRole === "citizen" ? "Citizen" : "Officer"}!`
            : "Create your citizen account"}
        </h2>

        <p className="auth-description">
          {isLogin
            ? "Enter your email and password to continue."
            : "Register to report road issues and track repairs."}
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder={
                isLogin
                  ? "Enter your password"
                  : "At least 8 characters"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isLogin ? undefined : 8}
              autoComplete={
                isLogin ? "current-password" : "new-password"
              }
              required
            />
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? `Login as ${loginRole === "citizen" ? "Citizen" : "Officer"} →`
                : "Create Citizen Account →"}
          </button>
        </form>

        {loginRole === "citizen" && (
          <p className="auth-switch">
            {isLogin
              ? "New to RoadCare?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setPassword("");
              }}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        )}

        {loginRole === "officer" && (
          <p className="auth-description">
            Officer accounts must be created or approved by an
            administrator. Public officer registration is disabled.
          </p>
        )}
      </section>
    </div>
  );
}

export default Auth;
