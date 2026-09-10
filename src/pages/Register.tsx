import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { login, register } from "@/api/auth";
import type { LoginParams, RegisterParams } from "@/types/auth";
import CookieUtil from "@/utils/cookie";

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const params: RegisterParams = {
        username: values.username,
        password: values.password,
        confirm_password: values.confirmPassword,
      };
      const res: any = await register(params);
      if (res?.code !== 200) {
        message.error(res?.message || "注册失败");
        return;
      }
      // 注册成功后自动登录，免得用户再去登录页重输一遍
      try {
        const loginParams: LoginParams = {
          username: values.username,
          password: values.password,
        };
        const loginRes: any = await login(loginParams);
        if (loginRes?.code !== 200) {
          // 自动登录失败不阻塞注册，回退到登录页
          message.success("注册成功，请登录");
          navigate("/login");
          return;
        }
        const data = loginRes?.data;
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
        message.success("注册成功");
        navigate("/");
      } catch (loginErr: any) {
        console.log("loginErr", loginErr);
        // 自动登录异常同样回退到登录页
        message.success("注册成功，请登录");
        navigate("/login");
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="register-page"
      style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px" }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>注册</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: "请输入用户名" },
            { min: 3, max: 20, message: "用户名长度为 3-20 个字符" },
          ]}
        >
          <Input placeholder="请输入用户名" allowClear />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, max: 20, message: "密码长度为 6-20 个字符" },
          ]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "请再次输入密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Register;
