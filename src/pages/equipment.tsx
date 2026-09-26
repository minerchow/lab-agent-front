import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Table,
  Upload,
  type TableProps,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getEquipmentList,
  equipmentCreate,
  equipmentUpdate,
  equipmentDelete,
} from "@/api/equipment";
import { getLabList } from "@/api/lab";
import { uploadFile } from "@/api/upload";
import { tauthtsBase } from "@/config";
import type {
  EquipmentCreateRequest,
  EquipmentResponse,
  EquipmentUpdateRequest,
} from "@/types/equipment";
import type { LabResponse } from "@/types/lab";
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

const Equipment = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EquipmentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keywords, setKeywords] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<EquipmentCreateRequest>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [editing, setEditing] = useState<EquipmentResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm<Record<string, any>>();
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);
  const [labs, setLabs] = useState<LabResponse[]>([]);

  const fetchLabs = async () => {
    try {
      const res: any = await getLabList({ page: 1, page_size: 10 });
      const ok =
        res?.code === 200 || res?.code === "200" || res?.success === true;
      if (!ok) return;
      const d: any = res?.data;
      const raw = d?.items ?? d?.list ?? d?.data ?? d;
      setLabs(Array.isArray(raw) ? (raw as LabResponse[]) : []);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const columns: TableProps<EquipmentResponse>["columns"] = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "名称", dataIndex: "name" },
    { title: "所属实验室", dataIndex: "lab_name", width: 140 },
    { title: "型号规格", dataIndex: "spec", width: 120 },
    { title: "数量", dataIndex: "quantity", width: 80 },
    {
      title: "状态",
      dataIndex: "status",
      width: 80,
      render: (status: number) => (status === 1 ? "正常" : "维修"),
    },
    { title: "说明", dataIndex: "description", ellipsis: true },
    {
      title: "创建时间",
      dataIndex: "created_at",
      render: formatTime,
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_, record) => (
        <>
          <Button
            type="link"
            onClick={() => handleEditClick(record)}
            style={{ padding: 0 }}
          >
            修改
          </Button>
          <Popconfirm
            title="确定删除该设备吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger style={{ padding: 0 }}>
              删除
            </Button>
          </Popconfirm>
        </>
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

  const handleEditClick = (record: EquipmentResponse) => {
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
      lab_id: record.lab_id,
      name: record.name,
      description: record.description,
      spec: record.spec,
      quantity: record.quantity,
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
      const payload: EquipmentUpdateRequest = {
        ...values,
        img: values.img?.[0]?.response?.data?.url ?? values.img?.[0]?.url,
      };
      const res = await equipmentUpdate(editing.id, payload);
      if (res?.code !== 200) {
        message.error(res?.message || "更新设备失败");
        return;
      }
      message.success("更新设备成功");
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
      const res: any = await getEquipmentList({
        page: p,
        page_size: ps,
        keywords: keywords || undefined,
      });
      // 兼容 code 为数字/字符串，或仅以 success 标识成功
      const ok =
        res?.code === 200 || res?.code === "200" || res?.success === true;
      if (!ok) {
        message.error(res?.message || "获取设备列表失败");
        return;
      }
      // 兼容多种响应结构：{data:{items}} / {data:[...]} / {data:{data:[...]}}
      const d: any = res?.data;
      const raw = d?.items ?? d?.list ?? d?.data ?? d;
      const list: EquipmentResponse[] = Array.isArray(raw)
        ? (raw as EquipmentResponse[])
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

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleSearch = (value: string) => {
    setKeywords(value);
    if (page !== 1) {
      setPage(1);
    } else {
      setRefreshTick((t) => t + 1);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await equipmentDelete(id);
      if (res?.code !== 200) {
        message.error(res?.message || "删除设备失败");
        return;
      }
      message.success("删除设备成功");
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      // img 字段绑定的是 Upload fileList，提交前转回 URL 字符串
      const payload: EquipmentCreateRequest = {
        ...values,
        img: values.img?.[0]?.response?.data?.url ?? values.img?.[0]?.url,
      };
      const res = await equipmentCreate(payload);
      if (res?.code !== 200) {
        message.error(res?.message || "创建设备失败");
        return;
      }
      message.success("创建设备成功");
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

  const labOptions = labs.map((l) => ({ value: l.id, label: l.name }));

  const renderFormItems = (isEdit: boolean) => (
    <>
      <Form.Item
        name="lab_id"
        label="所属实验室"
        rules={[{ required: true, message: "请选择所属实验室" }]}
      >
        <Select placeholder="请选择所属实验室" options={labOptions} />
      </Form.Item>
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: "请输入名称" }]}
      >
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item name="spec" label="型号规格">
        <Input placeholder="请输入型号规格" />
      </Form.Item>
      <Form.Item name="quantity" label="数量" initialValue={1}>
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          placeholder="请输入数量"
        />
      </Form.Item>
      <Form.Item name="description" label="说明">
        <Input.TextArea rows={3} placeholder="请输入说明" />
      </Form.Item>
      <Form.Item
        name="img"
        label="图片"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
      >
        <Upload {...(isEdit ? editUploadProps : uploadProps)}>
          {(isEdit ? editFileList : fileList).length === 0 && (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传图片</div>
            </div>
          )}
        </Upload>
      </Form.Item>
      <Form.Item
        name="status"
        label="状态"
        initialValue={isEdit ? undefined : 1}
      >
        <Select
          options={[
            { value: 1, label: "正常" },
            { value: 0, label: "维修" },
          ]}
        />
      </Form.Item>
    </>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Button
          type="primary"
          onClick={() => {
            form.resetFields();
            setFileList([]);
            setModalOpen(true);
          }}
        >
          新建
        </Button>
        <Input.Search
          placeholder="搜索设备名称"
          allowClear
          style={{ width: 240 }}
          onSearch={handleSearch}
        />
      </div>
      <Table<EquipmentResponse>
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
        title="新建设备"
        open={modalOpen}
        confirmLoading={submitting}
        onOk={() => form.submit()}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          {renderFormItems(false)}
        </Form>
      </Modal>
      <Modal
        title="修改设备"
        open={editOpen}
        confirmLoading={editSubmitting}
        onOk={() => editForm.submit()}
        onCancel={() => setEditOpen(false)}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          {renderFormItems(true)}
        </Form>
      </Modal>
    </div>
  );
};

export default Equipment;
