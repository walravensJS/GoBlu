import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { updateProfile, type User } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "./../firebase";  // Adjust path if needed
import { Camera, Save, AlertCircle, CheckCircle } from "lucide-react";

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

  // Placeholder avatar when no image is available
  const renderPlaceholderAvatar = () => {
    return (
      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-blue-600 text-2xl font-medium">
          {displayName ? displayName.charAt(0).toUpperCase() : "U"}
        </span>
      </div>
    );
  };

  // Show loading or an empty state while waiting for user data
  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-40 mt-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-lg mt-8">
      {/* Header section */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h1 className="text-2xl font-medium text-gray-800">Your Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile picture section */}
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
            <label htmlFor="profile-photo" className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-700 transition-colors">
              <Camera size={16} className="text-white" />
              <input 
                id="profile-photo"
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="hidden"
              />
            </label>
          </div>
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            Upload a clear photo of yourself
          </p>
        </div>
        
        {/* Form section */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 rounded-md text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                {user.email}
              </div>
            </div>

            {/* Error and success messages */}
            {message && (
              <div className="flex items-center bg-green-50 text-green-700 p-3 rounded-md">
                <CheckCircle size={18} className="mr-2" />
                {message}
              </div>
            )}
            
            {error && (
              <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-md">
                <AlertCircle size={18} className="mr-2" />
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Debug info panel (hidden in production) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-md text-xs border border-gray-200">
          <p className="font-semibold text-gray-600">Debug Info:</p>
          <p className="text-gray-500">User ID: {user.uid}</p>
          <p className="text-gray-500">Auth Status: {user ? "Authenticated" : "Not authenticated"}</p>
        </div>
      )}
    </div>
  );
}

export default Profile;