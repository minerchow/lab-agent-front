import { BaseResponse } from "@/types/base";
import { tauthtsBase } from "@/config";
import service from "@/utils/http";

/**
 * 上传结果类型
 */
export interface UploadResult {
  /** 文件访问地址 */
  url: string;
  /** 其他扩展字段 */
  [key: string]: any;
}

/**
 * 文件上传接口
 * @param file 要上传的文件，作为 form-data 中的 file 字段
 * @param config 额外的 axios 配置（如 onUploadProgress）
 * @returns Promise<BaseResponse<UploadResult>>
 */
export const uploadFile = (
  file: File,
  config?: any
): Promise<BaseResponse<UploadResult>> => {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    (service.post as any)(`${tauthtsBase()}/api/files/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    })
      .then(resolve)
      .catch(reject);
  });
};
