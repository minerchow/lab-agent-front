import { LoginParams, LoginResponse, RegisterParams } from "@/types/auth";
import { ContentType, post } from "@/utils/http";
import { tauthtsBase } from "@/config";
/**
 * 登录请求
 * @param params 登录参数
 * @returns Promise
 */
export const login = (params: LoginParams): Promise<LoginResponse> => {
  return post({
    url: `${tauthtsBase()}/api/users/login`, // 使用相对路径，通过代理转发到目标服务器
    data: params,
    contentType: ContentType.JSON,
    config: {
      noToken: true,
    },
  });
};

export const register = (params: RegisterParams): Promise<LoginResponse> => {
  return post({
    url: `${tauthtsBase()}/api/users/register`, // 使用相对路径，通过代理转发到目标服务器
    data: params,
    contentType: ContentType.JSON,
    config: {
      noToken: true,
    },
  });
};
