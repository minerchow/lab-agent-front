// 使用全局定义的CROSS_ENV（从rsbuild.config.js中定义的全局变量）

// 认证服务基础URL
export const tauthtsBase = () => {
  if (CROSS_ENV == "dev") {
    return "http://localhost:8000";
  }
};

export const ttv = () => {
  if (CROSS_ENV === "dev") {
    return "http://localhost:8000";
  }
};

// OAuth客户端ID
export const CLIENT_ID = "qiaohu_app";
