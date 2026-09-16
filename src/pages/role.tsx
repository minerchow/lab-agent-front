import { useEffect, useState } from "react";
import { Button, Form, Select, Spin, message } from "antd";
import { getUserList } from "@/api/user";
import { getRoleList } from "@/api/role";
import { post } from "@/utils/http";
import { tauthtsBase } from "@/config";
import type { User } from "@/types/auth";
import type { Role } from "@/api/role";

const Role = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      const res = await getUserList({ page: 1, page_size: 100 });
      if (res?.code !== 200) {
        return;
      }
      setUsers(res?.data?.items ?? []);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getRoleList();
      if (res?.code !== 200) {
        return;
      }
      setRoles(res?.data ?? []);
    } catch {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: { userId: number; roleId: number }) => {
    try {
      const res = await post({
        url: `${tauthtsBase()}/api/users/${values.userId}/roles`,
        data: { role_ids: [values.roleId] },
      });
      if (res?.code !== 200) {
        message.error(res?.message || "绑定角色失败");
        return;
      }
      message.success("绑定角色成功");
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px" }}>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="userId"
          label="用户"
          rules={[{ required: true, message: "请选择用户" }]}
        >
          <Select
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="请选择用户"
            showSearch
            optionFilterProp="label"
            options={users.map((user) => ({
              label: user.username,
              value: user.id,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="roleId"
          label="角色"
          rules={[{ required: true, message: "请选择角色" }]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder="请选择角色"
            showSearch
            optionFilterProp="label"
            options={roles.map((role) => ({
              label: role.name,
              value: role.id,
            }))}
          />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" style={{ width: "100%" }}>
            确定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Role;
