// Firebase Storage Helper with dual-mode fallback
import { app, hasFirebaseConfigured } from './config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadAttachment(file: File, folderName: string = 'attachments'): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // If Firebase is fully initialized and configured
  if (hasFirebaseConfigured && app) {
    try {
      const storage = getStorage(app);
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fileRef = ref(storage, `${folderName}/${fileName}`);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.warn('Firebase Storage upload failed, falling back to local encoding:', error);
    }
  }

  // Dual-mode fallback: Read file as Data URL string (Base64) for offline/demo operation
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}
