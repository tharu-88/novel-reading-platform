import React from "react";
import Avatar from "./Avatar.jsx";

const tabs = ["home", "explore", "library", "publish"];

export default function AppHeader({
  user,
  activeTab,
  onSelectTab,
  onShowProfile,
  onSignIn,
}) {
  return (
    <header>
      <button className="brand" onClick={() => onSelectTab("home")}>
        <span className="brand-mark">✺</span>
        <span>
          storyhaven<small>FOR THE LOVE OF STORIES</small>
        </span>
      </button>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => onSelectTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className="account">
        {user ? (
          <button
            className="avatar-btn"
            title="My profile"
            onClick={() => onShowProfile(user.id)}
          >
            <Avatar profile={user} />
          </button>
        ) : (
          <button className="outline" onClick={onSignIn}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
