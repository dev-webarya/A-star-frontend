import axios from 'axios';
import { getMediaSignature } from '../api/api/answerApi';

/**
 * Uploads a file directly to Cloudinary.
 * Tries backend-signed upload first; falls back to unsigned upload
 * if the signature endpoint returns 403 (requires VITE_CLOUDINARY env vars).
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The URL of the uploaded resource.
 */
export const uploadToCloudinary = async (file) => {
  try {
    return await signedUpload(file);
  } catch (signedError) {
    const cloudName = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME : undefined;
    const uploadPreset = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET : undefined;

    if (signedError?.response?.status === 403 && cloudName && uploadPreset) {
      console.warn('Cloudinary signature endpoint 403 — falling back to unsigned upload with preset');
      return await unsignedUpload(file, cloudName, uploadPreset);
    }

    console.error('Cloudinary upload error:', signedError);
    throw new Error('Failed to upload media. Please try again.');
  }
};

async function signedUpload(file) {
  const signatureData = await getMediaSignature();
  const { signature, timestamp, cloud_name, api_key, folder } = signatureData;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`;
  const response = await axios.post(uploadUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.secure_url;
}

async function unsignedUpload(file, cloudName, uploadPreset) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const response = await axios.post(uploadUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data.secure_url;
}
