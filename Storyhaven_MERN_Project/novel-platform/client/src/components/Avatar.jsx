import React from "react";

export default function Avatar({ profile, small = false }) {
  return (
    <span className={"avatar " + (small ? "small" : "")}>
      {profile?.photo ? (
        <img src={profile.photo} alt="Profile" />
      ) : (
        (profile?.username?.[0] || "◦").toUpperCase()
      )}
    </span>
  );
}
