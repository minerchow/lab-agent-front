import { BaseResponse } from "./base";
interface Role {
  id: number;
  name: string;
}

export interface User {
  username: string;
  id: number;
  nickname: string | null;
  avatar: string | null;
  roles?: Role[];
}

interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface LoginData {
  user: User;
  token: Token;
  access_token: string;
  refresh_token: string;
}
/**
 * 登录接口参数类型
 */
export interface LoginParams {
  username: string;
  password: string;
  client_id?: string;
  deviceId?: string;
  grant_type?: string;
  mark?: number;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirm_password?: string;
}

/**
 * 登录响应接口类型（继承基础响应接口）
 */
export interface LoginResponse extends BaseResponse<LoginData> {
  data: LoginData;
}
