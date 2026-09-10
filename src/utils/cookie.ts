import { jwtDecode } from "jwt-decode";

/**
 * Cookie工具类
 */
export class CookieUtil {
  /**
   * 设置Cookie
   * @param name Cookie名称
   * @param value Cookie值
   * @param expireTime 过期时间（秒）
   */
  static setCookie(name: string, value: string, expireTime: number) {
    const date = new Date();
    date.setTime(date.getTime() + expireTime * 1000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
  }

  /**
   * 获取Cookie
   * @param name Cookie名称
   * @returns Cookie值或null
   */
  static getCookie(name: string): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split("=");
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  /**
   * 删除Cookie
   * @param name Cookie名称
   */
  static deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * 从JWT token获取过期时间
   * @param token JWT token
   * @returns 过期时间（秒）
   */
  static getTokenExpireTime(token: string): number {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp - Math.floor(Date.now() / 1000);
    } catch (error) {
      console.error("JWT解码失败:", error);
      return 0;
    }
  }
}

/**
 * 设置Cookie（带过期时间）
 * @param name Cookie名称
 * @param value Cookie值
 * @param expireSeconds 过期时间（秒）
 */
export const setCookie = (
  name: string,
  value: string,
  expireSeconds: number
): void => {
  CookieUtil.setCookie(name, value, expireSeconds);
};

/**
 * 获取Cookie值
 * @param name Cookie名称
 * @returns Cookie值或null
 */
export const getCookie = (name: string): string | null => {
  return CookieUtil.getCookie(name);
};

/**
 * 删除Cookie
 * @param name Cookie名称
 */
export const deleteCookie = (name: string): void => {
  CookieUtil.deleteCookie(name);
};

/**
 * 清除所有指定名称的Cookie
 * @param names Cookie名称数组
 */
export const clearCookies = (names: string[]): void => {
  names.forEach((name) => CookieUtil.deleteCookie(name));
};

/**
 * 获取所有Cookie（返回对象）
 * @returns Cookie对象
 */
export const getAllCookies = (): Record<string, string> => {
  const cookies: Record<string, string> = {};
  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
};

export default CookieUtil;
