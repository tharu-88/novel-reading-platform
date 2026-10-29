import React from "react";

export default function AuthModal({
  mode,
  form,
  onChange,
  onClose,
  onModeChange,
  onSubmit,
}) {
  const isLogin = mode === "login";

  return (
    <div
      className="modal-wrap"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <button className="close" onClick={onClose}>
          ×
        </button>
        <span className="eyebrow">WELCOME TO STORYHAVEN</span>
        <h2>{isLogin ? "Welcome back" : "Start your story"}</h2>
        <p>
          {isLogin
            ? "Sign in to pick up where you left off."
            : "Create your account to read and write."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label>
            Username
            <input
              required
              minLength="3"
              maxLength="30"
              value={form.username}
              onChange={(event) =>
                onChange({ ...form, username: event.target.value })
              }
            />
          </label>
          {!isLogin && (
            <label>
              Email address
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  onChange({ ...form, email: event.target.value })
                }
              />
            </label>
          )}
          <label>
            Password
            <input
              type="password"
              required
              minLength="8"
              maxLength="72"
              value={form.password}
              onChange={(event) =>
                onChange({ ...form, password: event.target.value })
              }
            />
          </label>
          <button className="primary full">
            {isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
        <p>
          {isLogin ? "New around here?" : "Already have an account?"} {" "}
          <button
            className="text-button"
            onClick={() => onModeChange(isLogin ? "register" : "login")}
          >
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
