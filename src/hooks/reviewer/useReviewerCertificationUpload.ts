import { useMutation } from "@tanstack/react-query";
import {
  UploadCertificateRequest,
  UploadCertificateResponse,
  uploadCertificateService,
} from "../../api/reviewerCertificate.service";

export const useReviewerCertificationUpload = () => {
  return useMutation<UploadCertificateResponse, Error, UploadCertificateRequest>({
    mutationFn: uploadCertificateService,
  });
};