import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Spin,
  Upload,
  message,
} from "antd";
import { getUserInfo, updateUserInfo } from "@/api/user";
import { uploadFile } from "@/api/upload";
import type { User } from "@/types/auth";

const AVATAR_MAX_SIZE_MB = 5;

const UserInfo = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form] = Form.useForm<{ nickname?: string }>();

  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo();
      if (res?.code !== 200) {
        message.error(res?.message || "获取用户信息失败");
        return;
      }
      setUser(res?.data ?? null);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "获取用户信息失败，请稍后重试"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const startEdit = () => {
    setAvatarUrl(user?.avatar ?? null);
    form.setFieldsValue({ nickname: user?.nickname ?? undefined });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarUrl(null);
    form.resetFields();
  };

  // 手动上传：阻止 antd 默认上传行为，改用我们的上传接口
  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("仅支持上传图片文件");
      return false;
    }
    if (file.size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
      message.error(`图片不能超过 ${AVATAR_MAX_SIZE_MB}MB`);
      return false;
    }
    setUploading(true);
    try {
      const res = await uploadFile(file);
      if (res?.code !== 200) {
        message.error(res?.message || "头像上传失败");
        return false;
      }
      const url = res?.data?.url;
      if (!url) {
        message.error("上传接口返回数据缺少文件地址");
        return false;
      }
      setAvatarUrl("http://localhost:8000" + url);
      message.success("头像上传成功，记得保存");
    } catch (err: any) {
      message.error(err?.response?.data?.message || "头像上传失败，请稍后重试");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSave = async (values: { nickname?: string }) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: User = {
        ...user,
        nickname: values.nickname?.trim() || null,
        avatar: avatarUrl,
      };
      const res = await updateUserInfo(payload);
      if (res?.code !== 200) {
        message.error(res?.message || "保存失败");
        return;
      }
      message.success("保存成功");
      setUser(res?.data ?? payload);
      setEditing(false);
      setAvatarUrl(null);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 16px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const displayName = user?.nickname || user?.username || "";
  const shownAvatar = editing ? avatarUrl : (user?.avatar ?? null);

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 16px" }}>
      <Card
        extra={
          editing ? null : (
            <Button type="link" onClick={startEdit}>
              编辑
            </Button>
          )
        }
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar size={72} src={shownAvatar || undefined}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          {editing ? (
            <div style={{ marginTop: 12 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => handleAvatarUpload(file as File)}
              >
                <Button size="small" loading={uploading}>
                  {uploading ? "上传中..." : "更换头像"}
                </Button>
              </Upload>
            </div>
          ) : (
            <h2 style={{ margin: "12px 0 0" }}>{displayName}</h2>
          )}
        </div>

        {editing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            disabled={saving || uploading}
          >
            <Form.Item label="用户名">
              <Input value={user?.username} disabled />
            </Form.Item>
            <Form.Item
              label="昵称"
              name="nickname"
              rules={[{ max: 20, message: "昵称不能超过20个字符" }]}
            >
              <Input placeholder="请输入昵称" allowClear />
            </Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={cancelEdit} disabled={saving || uploading}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                disabled={uploading}
              >
                保存
              </Button>
            </Space>
          </Form>
        ) : (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">
              {user?.username ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="ID">{user?.id ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="昵称">
              {user?.nickname ?? "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
};

export default UserInfo;
