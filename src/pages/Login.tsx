import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/api/auth";
import type { LoginParams } from "@/types/auth";
import CookieUtil from "@/utils/cookie";

interface LoginFormValues {
  username: string;
  password: string;
}

const Login = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const params: LoginParams = {
        username: values.username,
        password: values.password,
      };
      const res: any = await login(params);
      console.log("登录成功", res);
      if (res?.code !== 200) {
        message.error(res?.message || "登录失败");
        return;
      }
      const data = res?.data;
      if (data?.token.refresh_token) {
        const refreshTokenExpireTime = CookieUtil.getTokenExpireTime(
          data?.token.refresh_token
        );
        if (refreshTokenExpireTime > 0) {
          CookieUtil.setCookie(
            "refreshtoken",
            data?.token.refresh_token,
            refreshTokenExpireTime
          );
        }
      }
      if (data?.token.access_token) {
        const accessTokenExpireTime = CookieUtil.getTokenExpireTime(
          data?.token.access_token
        );
        if (accessTokenExpireTime > 0) {
          CookieUtil.setCookie(
            "accesstoken",
            data?.token.access_token,
            accessTokenExpireTime
          );
        }
      }
      message.success("登录成功");
      navigate("/");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px" }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>登录</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true, message: "请输入用户名" }]}
        >
          <Input placeholder="请输入用户名" allowClear />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form.Item>

        <div style={{ textAlign: "center" }}>
          还没有账号？<Link to="/register">去注册</Link>
        </div>
      </Form>
    </div>
  );
};

export default Login;
