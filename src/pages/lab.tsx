import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Upload,
  type TableProps,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getLabList, labCreate, labUpdate } from "@/api/lab";
import { uploadFile } from "@/api/upload";
import { tauthtsBase } from "@/config";
import type {
  LabCreateRequest,
  LabResponse,
  LabUpdateRequest,
} from "@/types/lab";
import type { UploadFile, UploadProps } from "antd";

const formatTime = (v: string) => {
  if (!v) return "-";
  // 后端返回的是 UTC 时间但未带时区标识，补上 Z 再转北京时间
  const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(v);
  const date = new Date(hasTimezone ? v : `${v.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return v;
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
};

// 上传接口返回相对路径（如 /uploads/x.png），拼上后端域名才能访问
const resolveImgUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${tauthtsBase()}${url}`;
};

const Lab = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LabResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<LabCreateRequest>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [editing, setEditing] = useState<LabResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm<Record<string, any>>();
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);

  const columns: TableProps<LabResponse>["columns"] = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "名称", dataIndex: "name" },
    { title: "位置", dataIndex: "location" },
    { title: "容量", dataIndex: "capacity", width: 80 },
    { title: "开放时间", dataIndex: "open_time", width: 100 },
    { title: "关闭时间", dataIndex: "close_time", width: 100 },
    { title: "描述", dataIndex: "description", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      render: (status: number) => (status === 1 ? "开放" : "关闭"),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: formatTime,
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleEditClick(record)}
          style={{ padding: 0 }}
        >
          修改
        </Button>
      ),
    },
  ];

  const handleUpload = async (options: any) => {
    const res = await uploadFile(options.file as File);
    if (res?.code !== 200) {
      message.error(res?.message || "上传图片失败");
      options.onError?.(new Error(res?.message || "上传失败"));
      return;
    }
    // img 由 Form 绑定 Upload 的 fileList 自动收集，无需手动写入
    options.onSuccess?.(res, options.file);
  };

  const uploadProps: UploadProps = {
    listType: "picture-card",
    maxCount: 1,
    fileList,
    customRequest: handleUpload,
    onChange: ({ fileList: fl }) => setFileList(fl),
    onRemove: () => {
      form.setFieldsValue({ img: undefined });
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("只能上传图片文件");
      }
      return isImage || Upload.LIST_IGNORE;
    },
  };

  const handleEditUpload = async (options: any) => {
    const res = await uploadFile(options.file as File);
    if (res?.code !== 200) {
      message.error(res?.message || "上传图片失败");
      options.onError?.(new Error(res?.message || "上传失败"));
      return;
    }
    // img 由 Form 绑定 Upload 的 fileList 自动收集，无需手动写入
    options.onSuccess?.(res, options.file);
  };

  const editUploadProps: UploadProps = {
    listType: "picture-card",
    maxCount: 1,
    fileList: editFileList,
    customRequest: handleEditUpload,
    onChange: ({ fileList: fl }) => setEditFileList(fl),
    onRemove: () => {
      editForm.setFieldsValue({ img: undefined });
      setEditFileList([]);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("只能上传图片文件");
      }
      return isImage || Upload.LIST_IGNORE;
    },
  };

  const handleEditClick = (record: LabResponse) => {
    setEditing(record);
    const imgFile: UploadFile | null = record.img
      ? {
          uid: "-1",
          name: "img",
          status: "done",
          url: resolveImgUrl(record.img),
          thumbUrl: resolveImgUrl(record.img),
        }
      : null;
    editForm.setFieldsValue({
      name: record.name,
      location: record.location,
      capacity: record.capacity,
      open_time: record.open_time,
      close_time: record.close_time,
      description: record.description,
      // img 字段绑定 Upload 的 fileList，回显时传文件数组
      img: imgFile ? [imgFile] : [],
      status: record.status,
    });
    setEditFileList(imgFile ? [imgFile] : []);
    setEditOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!editing) return;
    setEditSubmitting(true);
    try {
      // img 字段绑定的是 Upload fileList，提交前转回 URL 字符串
      const payload: LabUpdateRequest = {
        ...values,
        img: values.img?.[0]?.response?.data?.url ?? values.img?.[0]?.url,
      };
      const res = await labUpdate(editing.id, payload);
      if (res?.code !== 200) {
        message.error(res?.message || "更新实验室失败");
        return;
      }
      message.success("更新实验室成功");
      setEditOpen(false);
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    } finally {
      setEditSubmitting(false);
    }
  };

  const fetchList = async (p: number, ps: number) => {
    setLoading(true);
    try {
      const res: any = await getLabList({ page: p, page_size: ps });
      // 兼容 code 为数字/字符串，或仅以 success 标识成功
      const ok =
        res?.code === 200 || res?.code === "200" || res?.success === true;
      if (!ok) {
        message.error(res?.message || "获取实验室列表失败");
        return;
      }
      // 兼容多种响应结构：{data:{items}} / {data:[...]} / {data:{data:[...]}}
      const d: any = res?.data;
      const raw = d?.items ?? d?.list ?? d?.data ?? d;
      const list: LabResponse[] = Array.isArray(raw)
        ? (raw as LabResponse[])
        : [];
      setItems(list);
      setTotal(d?.total ?? list.length);
    } catch {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(page, pageSize);
  }, [page, pageSize, refreshTick]);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      // img 字段绑定的是 Upload fileList，提交前转回 URL 字符串
      const payload: LabCreateRequest = {
        ...values,
        img: values.img?.[0]?.response?.data?.url ?? values.img?.[0]?.url,
      };
      const res = await labCreate(payload);
      if (res?.code !== 200) {
        message.error(res?.message || "创建实验室失败");
        return;
      }
      message.success("创建实验室成功");
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      if (page !== 1) {
        setPage(1);
      } else {
        setRefreshTick((t) => t + 1);
      }
    } catch {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={() => {
          form.resetFields();
          setModalOpen(true);
        }}
      >
        新建
      </Button>
      <Table<LabResponse>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Modal
        title="新建实验室"
        open={modalOpen}
        confirmLoading={submitting}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="capacity" label="容量">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入容量"
            />
          </Form.Item>
          <Form.Item name="open_time" label="开放时间">
            <Input placeholder="如 08:00" />
          </Form.Item>
          <Form.Item name="close_time" label="关闭时间">
            <Input placeholder="如 22:00" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="img"
            label="图片"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload {...uploadProps}>
              {fileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select
              options={[
                { value: 1, label: "开放" },
                { value: 0, label: "关闭" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="修改实验室"
        open={editOpen}
        confirmLoading={editSubmitting}
        onOk={() => editForm.submit()}
        onCancel={() => setEditOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="capacity" label="容量">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="请输入容量"
            />
          </Form.Item>
          <Form.Item name="open_time" label="开放时间">
            <Input placeholder="如 08:00" />
          </Form.Item>
          <Form.Item name="close_time" label="关闭时间">
            <Input placeholder="如 22:00" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="img"
            label="图片"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload {...editUploadProps}>
              {editFileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: 1, label: "开放" },
                { value: 0, label: "关闭" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Lab;
