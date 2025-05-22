import React, { type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';

interface ProfileAvatarProps {
  previewPhoto: string | null;
  displayName: string;
  onPhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileAvatar({ 
  previewPhoto, 
  displayName, 
  onPhotoChange 
}: ProfileAvatarProps) {
  const renderPlaceholderAvatar = () => (
    <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
      <span className="text-blue-600 text-2xl font-medium">
        {displayName ? displayName.charAt(0).toUpperCase() : "U"}
      </span>
    </div>
  );

  return (
    <div className="md:w-1/3 flex flex-col items-center">
      <div className="relative group">
        {previewPhoto ? (
          <img
            src={previewPhoto}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover shadow-sm"
          />
        ) : (
          renderPlaceholderAvatar()
        )}
        
        {/* Camera overlay */}
        <label 
          htmlFor="profile-photo" 
          className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-colors"
        >
          <Camera size={16} className="text-white" />
          <input 
            id="profile-photo"
            type="file" 
            accept="image/*" 
            onChange={onPhotoChange} 
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}