import httpClient from "./httpClient";

export interface UploadAudioFile {
  uri: string;
  name?: string;
  type?: string;
}

export interface UploadAudioResponse {
  success: boolean;
  url: string;
  message?: string;
}

/**
 * Upload audio file to backend API via upload/audio endpoint
 * @param file - Audio file to upload (with uri, name, type)
 * @returns Promise resolving to the secure URL of the uploaded audio, or null if upload fails
 */
export const uploadAudioToCloudinary = async (
  file: UploadAudioFile
): Promise<string | null> => {
  try {
    if (!file || !file.uri) {
      console.error("No file or URI provided");
      return null;
    }

    // Extract file name from URI if not provided, đảm bảo extension là .mp3
    const defaultFileName = `audio-${Date.now()}.mp3`;
    let fileName = file.name || defaultFileName;
    
    // Đảm bảo file name có extension .mp3
    if (!fileName.toLowerCase().endsWith('.mp3')) {
      // Thay thế extension hiện tại bằng .mp3 hoặc thêm .mp3 nếu không có extension
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      fileName = nameWithoutExt + '.mp3';
    }
    
    // Determine MIME type - sử dụng audio/mpeg cho .mp3
    const mimeType = file.type || "audio/mpeg";

    // Create FormData
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: fileName,
      type: mimeType,
    } as any);

    // Make request to backend
    const response = await httpClient.post<UploadAudioResponse>(
      "upload/audio",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Check response
    if (response.data.success && response.data.url) {
      let finalUrl = response.data.url;
      
      // Đảm bảo URL luôn có extension .mp3
      // Tách URL thành base URL và query parameters
      const urlParts = finalUrl.split('?');
      let baseUrl = urlParts[0];
      const queryString = urlParts.length > 1 ? '?' + urlParts.slice(1).join('?') : '';
      
      // Kiểm tra và thay thế extension hiện tại bằng .mp3
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.flac', '.webm'];
      const baseUrlLower = baseUrl.toLowerCase();
      
      // Tìm extension hiện tại
      let hasExtension = false;
      for (const ext of audioExtensions) {
        if (baseUrlLower.endsWith(ext)) {
          // Thay thế extension hiện tại bằng .mp3
          baseUrl = baseUrl.substring(0, baseUrl.length - ext.length) + '.mp3';
          hasExtension = true;
          break;
        }
      }
      
      // Nếu không có extension, thêm .mp3
      if (!hasExtension) {
        baseUrl = baseUrl + '.mp3';
      }
      
      finalUrl = baseUrl + queryString;
      
      console.log("Audio uploaded successfully:", finalUrl);
      return finalUrl;
    } else {
      console.error("Audio upload failed: Invalid response format", response.data);
      return null;
    }
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Upload audio thất bại";
    console.error("Error uploading audio:", errorMessage);
    throw new Error(errorMessage);
  }
};

