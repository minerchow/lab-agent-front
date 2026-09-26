import axios from "axios";
import { CookieUtil } from "./cookie";
import { isApp } from "./device";
import { tauthtsBase } from "@/config";

// 创建 axios 实例
const service = axios.create({
  // 基础URL，可根据环境变量配置
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

// 正在进行中的刷新请求，并发调用共享同一次刷新，避免重复请求
let refreshPromise: Promise<string> | null = null;

/**
 * 存储token到Cookie（带过期时间）
 * @param accessToken accessToken
 * @param refreshToken refreshToken
 */
const storeTokensInCookie = (accessToken: string, refreshToken?: string) => {
  // 存储accessToken到Cookie，使用JWT中的过期时间
  const accessTokenExpireTime = CookieUtil.getTokenExpireTime(accessToken);
  console.log("accessTokenExpireTime", accessTokenExpireTime);
  if (accessTokenExpireTime > 0) {
    CookieUtil.setCookie(
      "accesstoken",
      accessToken,
      accessTokenExpireTime - 900
    );
  }

  // 存储refreshToken到Cookie（如果提供）
  if (refreshToken) {
    const refreshTokenExpireTime = CookieUtil.getTokenExpireTime(refreshToken);
    if (refreshTokenExpireTime > 0) {
      CookieUtil.setCookie(
        "refreshtoken",
        refreshToken,
        refreshTokenExpireTime
      );
    }
  }
};

/**
 * 从Cookie获取token
 */
const getTokensFromCookie = () => {
  return {
    accessToken: CookieUtil.getCookie("accesstoken"),
    refreshToken: CookieUtil.getCookie("refreshtoken"),
  };
};

/**
 * 清除Cookie中的token
 */
const clearTokensFromCookie = () => {
  CookieUtil.deleteCookie("accesstoken");
  CookieUtil.deleteCookie("refreshtoken");
};

/**
 * 刷新accessToken
 * @returns 新的accessToken
 */
const refreshAccessToken = async (): Promise<string> => {
  const { refreshToken } = getTokensFromCookie();

  try {
    if (!refreshToken) {
      throw new Error("没有refreshToken");
    }

    // 使用原生axios实例，避免拦截器递归
    const refreshService = axios.create({
      timeout: 10000,
    });

    // 发送刷新token请求
    const response: any = await refreshService.post(
      `${tauthtsBase()}/api/users/refresh`,
      {
        refresh_token: refreshToken,
      }
    );

    const tokenData = response.data?.data;
    if (!tokenData || !tokenData.access_token) {
      throw new Error("刷新token响应格式错误");
    }

    // 更新Cookie中的token
    storeTokensInCookie(tokenData.access_token, tokenData.refresh_token);

    console.log("token刷新成功");
    return tokenData.access_token;
  } catch (error) {
    console.error("刷新token失败:", error);
    // 清除Cookie中的token
    clearTokensFromCookie();
    throw error;
  }
};

/**
 * 并发去重的token刷新：多个请求同时触发401时只发一次刷新请求
 */
const refreshAccessTokenOnce = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

/**
 * 刷新accessToken，失败时清除token并跳转登录页
 * 同时导出给 fetch/SSE 等非 axios 请求在收到 401 时刷新重试
 */
export const refreshTokenWithRedirect = async (): Promise<string> => {
  try {
    return await refreshAccessTokenOnce();
  } catch (error) {
    clearTokensFromCookie();
    window.location.href = "/login";
    throw error;
  }
};

/**
 * 判断业务返回体是否为未授权（code 或 status 为 401）
 */
const isUnauthorizedBody = (data: any): boolean => {
  if (!data || typeof data !== "object") {
    return false;
  }
  const code = data.code ?? data.status;
  return Number(code) === 401;
};

// 请求拦截器
service.interceptors.request.use(
  async (config: any) => {
    // 设置固定的请求头
    config.headers["code"] = "xxx";

    // 可以在这里添加token等认证信息
    // 如果没有明确指定不需要token，则添加token
    if (!config.noToken) {
      if (!isApp()) {
        const { accessToken, refreshToken } = getTokensFromCookie();

        // 如果没有refreshToken，跳转到登录页
        if (!refreshToken) {
          console.log("没有refreshToken，跳登陆");
          window.location.href = "/login";
          return Promise.reject(new Error("没有refreshToken"));
        }

        // 如果没有accessToken，刷新token
        if (!accessToken) {
          try {
            const newAccessToken = await refreshTokenWithRedirect();
            config.headers["Authorization"] = "Bearer " + newAccessToken;
          } catch (error) {
            console.error("刷新token失败:", error);
            return Promise.reject(error);
          }
        } else {
          // 有accessToken，直接使用
          config.headers["Authorization"] = "Bearer " + accessToken;
        }
      }
    }

    // noToken是自定义标记，axios不会发送到服务器，保留它以便响应拦截器识别免token请求
    return config;
  },
  (error: any) => {
    // 处理请求错误
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: any) => {
    // 统一剥掉axios外层，直接返回业务响应体 {code, message, data}，调用方少写一层 .data
    const data = response.data;
    const originalRequest = response.config;
    // 返回体中的401（HTTP 200但code/status为401）：刷新token后重试原请求
    if (
      isUnauthorizedBody(data) &&
      !originalRequest?.noToken &&
      !isApp() &&
      originalRequest
    ) {
      // 避免无限重试
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        return refreshTokenWithRedirect().then((token) => {
          originalRequest.headers["Authorization"] = "Bearer " + token;
          return service(originalRequest);
        });
      }
      // 已重试过仍返回401，直接把结果交给调用方处理
    }

    return data;
  },
  async (error: any) => {
    // 处理响应错误
    console.error("响应错误:", error);
    const originalRequest = error.config;

    // 免token请求（如登录/注册）不走401刷新逻辑，避免跳转导致页面刷新
    if (originalRequest?.noToken) {
      return Promise.reject(error);
    }

    // HTTP状态码401（或响应体code为401）：刷新token后重试原请求
    // 注意：error.response 是 AxiosResponse，HTTP状态码在 status 上，
    // 业务码（如 {"code":401,"message":"Invalid token"}）在 data 上
    const response = error.response;
    if (
      (response?.status === 401 || isUnauthorizedBody(response?.data)) &&
      !isApp() &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshTokenWithRedirect();
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return service(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Content-Type 枚举
export enum ContentType {
  JSON = "application/json",
  FORM_URLENCODED = "application/x-www-form-urlencoded",
}

/**
 * 处理 x-www-form-urlencoded 格式的数据
 * @param data 需要转换的数据
 * @returns 转换后的字符串
 */
const transformFormData = (data: Record<string, any>): string => {
  const formData = new URLSearchParams();
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      formData.append(key, String(data[key]));
    }
  }
  return formData.toString();
};

/**
 * GET 请求方法
 * @param options 请求选项
 * @returns Promise
 */
export const get = ({
  url,
  params,
  config,
}: {
  url: string;
  params?: Record<string, any>;
  contentType?: ContentType;
  config?: any;
}): Promise<any> => {
  // GET请求不需要Content-Type头，但明确指定Accept为JSON
  const headers = {
    Accept: "application/json",
  };

  return new Promise((resolve, reject) => {
    service
      .get(url, { params, headers, ...config })
      .then(resolve)
      .catch(reject);
  });
};

/**
 * POST 请求方法
 * @param options 请求选项
 * @returns Promise
 */
export const post = ({
  url,
  data,
  contentType = ContentType.JSON,
  config,
}: {
  url: string;
  data?: Record<string, any>;
  contentType?: ContentType;
  config?: any;
}): Promise<any> => {
  // 根据 contentType 处理数据
  const headers = { "Content-Type": contentType };

  return new Promise((resolve, reject) => {
    if (contentType === ContentType.FORM_URLENCODED && data) {
      service
        .post(url, transformFormData(data), { headers, ...config })
        .then(resolve)
        .catch(reject);
    } else {
      service
        .post(url, data, { headers, ...config })
        .then(resolve)
        .catch(reject);
    }
  });
};

/**
 * 设置认证token（用于登录成功后调用）
 * @param accessToken accessToken
 * @param refreshToken refreshToken
 */
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  storeTokensInCookie(accessToken, refreshToken);
};

/**
 * 清除认证token（用于登出）
 */
export const clearAuthTokens = () => {
  clearTokensFromCookie();
};

/**
 * 获取当前accessToken
 * @returns accessToken或null
 */
export const getAccessToken = (): string | null => {
  return CookieUtil.getCookie("accesstoken");
};

/**
 * 确保存在可用的 accessToken（缺失时自动刷新），供 fetch/SSE 等
 * 非 axios 请求复用与拦截器一致的鉴权逻辑
 * @returns accessToken，未登录或刷新失败时返回 null
 */
export const ensureAccessToken = async (): Promise<string | null> => {
  if (isApp()) {
    return null;
  }

  const { accessToken, refreshToken } = getTokensFromCookie();
  if (!refreshToken) {
    return null;
  }
  if (accessToken) {
    return accessToken;
  }

  try {
    await refreshAccessTokenOnce();
    return getAccessToken();
  } catch {
    return null;
  }
};

/**
 * 检查是否已登录
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  return !!CookieUtil.getCookie("accesstoken");
};

export default service;
