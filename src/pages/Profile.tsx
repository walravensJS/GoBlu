import React from 'react';
import { ProfileHeader } from '../components/design/profile/ProfileHeader';
import { ProfileAvatar } from '../components/design/profile/ProfileAvatar';
import { ProfileForm } from '../components/functional/profile/ProfileForm';
import { LoadingState } from '../components/functional/profile/LoadingState';
import { DebugPanel } from '../components/functional/profile/DebugPanel';
import { useProfileLogic } from '../hooks/useProfileLogic';

export default function Profile() {
  const {
    user,
    displayName,
    previewPhoto,
    loading,
    message,
    error,
    handlePhotoChange,
    handleDisplayNameChange,
    handleSubmit,
  } = useProfileLogic();

  // Show loading or an empty state while waiting for user data
  if (!user) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-lg mt-8">
      <ProfileHeader />
      
      <div className="flex flex-col md:flex-row gap-8">
        <ProfileAvatar
          previewPhoto={previewPhoto}
          displayName={displayName}
          onPhotoChange={handlePhotoChange}
        />
        
        <ProfileForm
          user={user}
          displayName={displayName}
          onDisplayNameChange={handleDisplayNameChange}
          onSubmit={handleSubmit}
          loading={loading}
          message={message}
          error={error}
        />
      </div>
      
      <DebugPanel user={user} />
    </div>
  );
}