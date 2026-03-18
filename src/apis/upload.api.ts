import { Platform } from "react-native";
import apiClient from "./client";

interface UploadResponse {
  url: string;
  publicId: string;
}

export const uploadApi = {
  uploadImage: async (uri: string): Promise<string> => {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const blob = await fetch(uri).then((r) => r.blob());
      const ext = blob.type.split("/")[1] || "jpeg";
      const file = new File([blob], `upload.${ext}`, { type: blob.type });
      formData.append("file", file);
    } else {
      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("file", { uri, name: filename, type } as any);
    }

    const response = await apiClient.post<unknown, UploadResponse>(
      "/upload/image",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.url;
  },
};
