import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase/firebase";

// Get Firebase app instance from auth
const app = auth.app;
// Initialize storage with explicit bucket URL
const storage = getStorage(app);

export class StorageService {
  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
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
  }
}