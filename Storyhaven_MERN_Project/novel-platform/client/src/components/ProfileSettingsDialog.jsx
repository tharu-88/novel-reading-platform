import React, { useState } from "react";
import { Trash2 } from "lucide-react";

export default function ProfileSettingsDialog({
  bio,
  photo,
  onBioChange,
  onPhotoChange,
  onImageSelect,
  onClearPhoto,
  onSaveProfile,
  onChangePassword,
  onSignOut,
  onClose,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }
    if (await onChangePassword({ currentPassword, newPassword })) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div
      className="modal-wrap"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal profile-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
      >
        <button className="close" aria-label="Close settings" onClick={onClose}>
          ×
        </button>
        <span className="eyebrow">ACCOUNT</span>
        <h2 id="profile-settings-title">Profile settings</h2>

        <section className="settings-section">
          <h3>Profile</h3>
          <label>
            Profile picture
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                onImageSelect(event.target.files[0], onPhotoChange)
              }
            />
          </label>
          {photo && (
            <div className="settings-photo-actions">
              <img className="cover-preview" src={photo} alt="Profile preview" />
              <button
                className="icon-button danger"
                aria-label="Remove profile photo"
                title="Remove profile photo"
                onClick={onClearPhoto}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          )}
          <label>
            Bio
            <textarea
              maxLength="500"
              value={bio}
              onChange={(event) => onBioChange(event.target.value)}
              placeholder="Tell readers a little about yourself"
            />
          </label>
          <button
            className="primary"
            onClick={async () => {
              if (await onSaveProfile()) onClose();
            }}
          >
            Save profile
          </button>
        </section>

        <hr className="settings-divider" />

        <form className="settings-section" onSubmit={submitPassword}>
          <h3>Change password</h3>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength="8"
              maxLength="72"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength="8"
              maxLength="72"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {passwordError && (
            <p className="settings-error" role="alert">
              {passwordError}
            </p>
          )}
          <button className="primary" type="submit">
            Update password
          </button>
        </form>

        <div className="settings-footer">
          <button className="outline" onClick={onSignOut}>
            Sign out
          </button>
          <button className="text-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
