import httpClient from "./httpClient";

export interface UploadCertificateFile {
  uri: string;
  name: string;
  type?: string | null;
}

export interface UploadCertificateRequest {
  file: UploadCertificateFile;
  name: string;
}

export interface UploadCertificateResponse {
  isSucess: boolean;
  data: {
    certificateId: string;
    name: string;
    url: string;
    newStatus: "Pending" | "Approved" | "Rejected"; // nếu biết trước ENUM thì để luôn
  };
  businessCode: number;
  message: string;
}

const MAX_FILE_NAME_LENGTH = 80;
const MAX_DISPLAY_NAME_LENGTH = 120;

const shortenFileName = (name: string) => {
  if (!name) {
    return "certificate.dat";
  }

  const lastDotIndex = name.lastIndexOf(".");
  const extension = lastDotIndex > -1 ? name.slice(lastDotIndex) : "";
  const baseName = lastDotIndex > -1 ? name.slice(0, lastDotIndex) : name;

  if (name.length <= MAX_FILE_NAME_LENGTH) {
    return name;
  }

  const allowedBaseLength = Math.max(
    1,
    MAX_FILE_NAME_LENGTH - extension.length
  );

  return `${baseName.slice(0, allowedBaseLength)}${
    extension || ".dat"
  }`.trim();
};

const inferMimeType = (name: string) => {
  const extension = name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "pdf":
      return "application/pdf";
    case "heic":
      return "image/heic";
    default:
      return "application/octet-stream";
  }
};

const shortenDisplayName = (name: string, fallback: string) => {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.length > MAX_DISPLAY_NAME_LENGTH
    ? trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH)
    : trimmed;
};

export const uploadCertificateService = async (
  data: UploadCertificateRequest
): Promise<UploadCertificateResponse> => {
  try {
    const safeFileName = shortenFileName(data.file.name);
    const safeDisplayName = shortenDisplayName(data.name, safeFileName);
    const mimeType = data.file.type || inferMimeType(safeFileName);

    const formData = new FormData();
    formData.append(
      "file",
      {
        uri: data.file.uri,
        name: safeFileName,
        type: mimeType,
      } as any
    );
    formData.append("name", safeDisplayName);

    const response = await httpClient.post<UploadCertificateResponse>(
      "Certificate/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Không thể tải chứng chỉ";
    throw new Error(message);
  }
};