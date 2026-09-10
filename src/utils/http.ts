import axios from "axios";
import { CookieUtil } from "./cookie";
import { isApp } from "./device";

// 创建 axios 实例
const service = axios.create({
  // 基础URL，可根据环境变量配置
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

// 用于标记是否正在刷新token，防止递归
let isRefreshing = false;
// 存储等待刷新token的请求
let refreshSubscribers: ((token: string) => void)[] = [];

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
 */
const refreshAccessToken = async () => {
  const { refreshToken } = getTokensFromCookie();
  if (!refreshToken) {
    throw new Error("没有refreshToken");
  }

  try {
    // 使用原生axios实例，避免拦截器递归
    const refreshService = axios.create({
      timeout: 10000,
    });

    // 从配置文件获取client_id

    // 构建刷新token的请求数据
    const refreshData = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: "qh-tesla-app",
      mark: 1,
      deviceId: "18171adc022bf26d4fd",
    };

    // 发送刷新token请求
    const response: any = await refreshService.post(
      "/oauth/token",
      transformFormData(refreshData),
      {
        headers: {
          "Content-Type": ContentType.FORM_URLENCODED,
          code: "xxx",
        },
      }
    );

    if (response.data && response.data.access_token) {
      // 更新Cookie中的token
      storeTokensInCookie(
        response.data.access_token,
        response.data.refresh_token
      );

      // 通知所有等待的请求
      refreshSubscribers.forEach((callback) =>
        callback(response.data.access_token)
      );
      refreshSubscribers = [];

      console.log("token刷新成功");
    } else {
      throw new Error("刷新token响应格式错误");
    }
  } catch (error) {
    console.error("刷新token失败:", error);
    // 清除Cookie中的token
    clearTokensFromCookie();
    throw error;
  }
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
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              await refreshAccessToken();
              const { accessToken: newAccessToken } = getTokensFromCookie();
              config.headers["Authorization"] = "Bearer " + newAccessToken;
            } catch (error) {
              console.error("刷新token失败:", error);
              return Promise.reject(error);
            } finally {
              isRefreshing = false;
            }
          } else {
            // 如果正在刷新，等待刷新完成
            return new Promise((resolve) => {
              refreshSubscribers.push((token: string) => {
                config.headers["Authorization"] = "Bearer " + token;
                resolve(config);
              });
            });
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
    return response.data;
  },
  async (error: any) => {
    // 处理响应错误
    console.error("响应错误:", error);
    // 免token请求（如登录/注册）不走401刷新逻辑，避免跳转导致页面刷新
    if (error.config?.noToken) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !isApp()) {
      // 处理未授权错误
      const originalRequest = error.config;

      // 避免无限重试
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;

          try {
            await refreshAccessToken();
            isRefreshing = false;

            // 重试原始请求
            const { accessToken: newAccessToken } = getTokensFromCookie();
            originalRequest.headers["Authorization"] =
              "Bearer " + newAccessToken;
            return service(originalRequest);
          } catch (refreshError) {
            isRefreshing = false;
            // 刷新失败，跳转到登录页
            clearTokensFromCookie();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        } else {
          // 如果正在刷新，等待刷新完成后再重试
          return new Promise((resolve) => {
            refreshSubscribers.push((token: string) => {
              originalRequest.headers["Authorization"] = "Bearer " + token;
              resolve(service(originalRequest));
            });
          });
        }
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
 * 检查是否已登录
 * @returns boolean
 */
export const isAuthenticated = (): boolean => {
  return !!CookieUtil.getCookie("accesstoken");
};

export default service;
