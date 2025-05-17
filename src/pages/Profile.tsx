import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { updateProfile, type User } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "./../firebase";  // Adjust path if needed

// Get Firebase app instance from auth
const app = auth.app;
// Initialize storage with explicit bucket URL
const storage = getStorage(app);

function Profile() {
  const [user, setUser] = useState<User | null>(null);

  // Form fields state
  const [displayName, setDisplayName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load current user info
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setPreviewPhoto(currentUser.photoURL);
    }
  }, []);

  // Handle file input change (for preview)
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Revoke previous preview URL if any (to free memory)
      if (previewPhoto && previewPhoto.startsWith("blob:")) {
        URL.revokeObjectURL(previewPhoto);
      }
      setPhotoFile(e.target.files[0]);
      setPreviewPhoto(URL.createObjectURL(e.target.files[0]));
      // Reset any previous errors when selecting a new file
      setError(null);
    }
  };

  // Upload photo to Firebase Storage and get URL
  const uploadProfilePhoto = async (userId: string, file: File) => {
    try {
      // Create a safe filename with timestamp to avoid conflicts
      const fileExtension = file.name.split('.').pop();
      const safeFileName = `profile_${Date.now()}.${fileExtension}`;
      
      // Create storage reference
      const photoRef = ref(storage, `profilePhotos/${userId}/${safeFileName}`);
      
      console.log("Starting upload to:", photoRef.fullPath);
      console.log("File type:", file.type);
      
      // Add metadata to the upload
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'uploadedBy': userId,
          'originalName': file.name
        }
      };
      
      // Upload the file with metadata
      const uploadResult = await uploadBytes(photoRef, file, metadata);
      console.log("Upload successful:", uploadResult);
      
      // Get download URL
      const downloadURL = await getDownloadURL(photoRef);
      console.log("Download URL obtained:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("Error in uploadProfilePhoto:", error);
      // Provide more detailed error info
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("CORS")) {
        throw new Error("CORS error: Cannot upload to Firebase Storage from this origin. Please check your Firebase Storage CORS configuration.");
      } else {
        throw error; // Re-throw for handling in the form submit
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(null);

    if (!user) {
      setError("No user logged in.");
      setLoading(false);
      return;
    }

    try {
      const updateData: { displayName?: string; photoURL?: string } = {};

      if (displayName.trim() !== user.displayName) {
        updateData.displayName = displayName.trim();
      }

      if (photoFile) {
        try {
          const photoURL = await uploadProfilePhoto(user.uid, photoFile);
          updateData.photoURL = photoURL;
        } catch (uploadError) {
          setError(`Photo upload failed: ${(uploadError as Error).message}`);
          setLoading(false);
          return;
        }
      }

      if (Object.keys(updateData).length === 0) {
        setMessage("Nothing to update.");
        setLoading(false);
        return;
      }

      await updateProfile(user, updateData);

      // Refresh user data from Firebase to keep in sync
      await user.reload();
      const refreshedUser = auth.currentUser;
      setUser(refreshedUser);

      setMessage("Profile updated successfully!");

      // Clear photoFile input (but keep preview to new URL)
      setPhotoFile(null);
    } catch (error) {
      setError("Error updating profile: " + (error as Error).message);
    }

    setLoading(false);
  };

  if (!user) {
    return <p>Loading user info...</p>;
  }

  return (
    <div className="max-w-md mx-auto p-6 rounded-md mt-8 bg-white text-black shadow">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p className="mb-4"><strong>Email:</strong> {user.email}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block font-semibold mb-1">
            Username
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 rounded text-black border border-gray-300"
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Profile Picture</label>
          {previewPhoto ? (
            <img
              src={previewPhoto}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full object-cover mb-2"
            />
          ) : (
            <p className="mb-2">No photo uploaded</p>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>

      {message && <p className="mt-4 text-center text-green-600">{message}</p>}
      {error && <p className="mt-4 text-center text-red-600">{error}</p>}

      {/* Debug info panel (remove in production) */}
      <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
        <p className="font-semibold">Debug Info:</p>
        <p>User ID: {user.uid}</p>
        <p>Auth Status: {user ? "Authenticated" : "Not authenticated"}</p>
      </div>
    </div>
  );
}

export default Profile;