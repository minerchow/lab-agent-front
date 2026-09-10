/**
 * 基础响应接口
 * 所有接口响应都应该继承这个接口
 */
export interface BaseResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
  code?: number;
}

/**
 * 分页响应数据的基础接口
 */
export interface PageData<T = any> {
  list: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * 分页响应接口
 */
export interface PageResponse<T = any> extends BaseResponse<PageData<T>> {
  data: PageData<T>;
}
