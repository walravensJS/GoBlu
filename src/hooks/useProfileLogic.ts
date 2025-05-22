import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { updateProfile, type User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { StorageService } from "../services/storageService";
import { type ProfileState, type ProfileUpdateData } from "../services/types";

interface UseProfileLogicReturn extends ProfileState {
  handlePhotoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDisplayNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

export function useProfileLogic(): UseProfileLogicReturn {
  const [state, setState] = useState<ProfileState>({
    user: null,
    displayName: "",
    photoFile: null,
    previewPhoto: null,
    loading: false,
    message: "",
    error: null,
  });

  // Load current user info
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setState(prev => ({
        ...prev,
        user: currentUser,
        displayName: currentUser.displayName || "",
        previewPhoto: currentUser.photoURL,
      }));
    }
  }, []);

  // Handle file input change (for preview)
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Revoke previous preview URL if any (to free memory)
      if (state.previewPhoto && state.previewPhoto.startsWith("blob:")) {
        URL.revokeObjectURL(state.previewPhoto);
      }
      
      setState(prev => ({
        ...prev,
        photoFile: e.target.files![0],
        previewPhoto: URL.createObjectURL(e.target.files![0]),
        error: null, // Reset any previous errors when selecting a new file
      }));
    }
  };

  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      displayName: e.target.value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setState(prev => ({
      ...prev,
      loading: true,
      message: "",
      error: null,
    }));

    if (!state.user) {
      setState(prev => ({
        ...prev,
        error: "No user logged in.",
        loading: false,
      }));
      return;
    }

    try {
      const updateData: ProfileUpdateData = {};

      if (state.displayName.trim() !== state.user.displayName) {
        updateData.displayName = state.displayName.trim();
      }

      if (state.photoFile) {
        try {
          const photoURL = await StorageService.uploadProfilePhoto(state.user.uid, state.photoFile);
          updateData.photoURL = photoURL;
        } catch (uploadError) {
          setState(prev => ({
            ...prev,
            error: `Photo upload failed: ${(uploadError as Error).message}`,
            loading: false,
          }));
          return;
        }
      }

      if (Object.keys(updateData).length === 0) {
        setState(prev => ({
          ...prev,
          message: "Nothing to update.",
          loading: false,
        }));
        return;
      }

      await updateProfile(state.user, updateData);

      // Refresh user data from Firebase to keep in sync
      await state.user.reload();
      const refreshedUser = auth.currentUser;
      
      setState(prev => ({
        ...prev,
        user: refreshedUser,
        message: "Profile updated successfully!",
        photoFile: null, // Clear photoFile input (but keep preview to new URL)
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: "Error updating profile: " + (error as Error).message,
        loading: false,
      }));
    }
  };

  return {
    ...state,
    handlePhotoChange,
    handleDisplayNameChange,
    handleSubmit,
  };
}