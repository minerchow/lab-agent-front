import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  getReservationList,
  reservationApprove,
  reservationCancel,
  reservationCreate,
  reservationDelete,
  reservationUpdate,
} from "@/api/reservation";
import { getLabList } from "@/api/lab";
import { getEquipmentList } from "@/api/equipment";
import type { ReservationDetailResponse } from "@/types/reservation";
import type { LabResponse } from "@/types/lab";
import type { EquipmentResponse } from "@/types/equipment";

const formatTime = (v?: string) =>
  v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-";

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: "待审核", color: "gold" },
  1: { text: "已通过", color: "green" },
  2: { text: "已拒绝", color: "red" },
  3: { text: "已取消", color: "default" },
};

const Reservation = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReservationDetailResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keywords, setKeywords] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<Record<string, any>>();
  const [refreshTick, setRefreshTick] = useState(0);
  const [editing, setEditing] = useState<ReservationDetailResponse | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm] = Form.useForm<Record<string, any>>();
  const [labs, setLabs] = useState<LabResponse[]>([]);
  const [equipments, setEquipments] = useState<EquipmentResponse[]>([]);
  const [createLabId, setCreateLabId] = useState<number | undefined>();

  const fetchLabs = async () => {
    try {
      const res: any = await getLabList({ page: 1, page_size: 100 });
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

  const fetchEquipments = async (labId?: number) => {
    try {
      const res: any = await getEquipmentList({
        page: 1,
        page_size: 100,
        lab_id: labId,
      });
      const ok =
        res?.code === 200 || res?.code === "200" || res?.success === true;
      if (!ok) return;
      const d: any = res?.data;
      const raw = d?.items ?? d?.list ?? d?.data ?? d;
      setEquipments(Array.isArray(raw) ? (raw as EquipmentResponse[]) : []);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const columns: TableProps<ReservationDetailResponse>["columns"] = [
    { title: "ID", dataIndex: "id", width: 80 },
    { title: "用户", dataIndex: "user_name", width: 110 },
    { title: "实验室", dataIndex: "lab_name", width: 140 },
    { title: "设备", dataIndex: "equipment_name", width: 140 },
    { title: "日期", dataIndex: "date", width: 110 },
    { title: "开始时间", dataIndex: "start_time", width: 90 },
    { title: "结束时间", dataIndex: "end_time", width: 90 },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (status: number) => {
        const s = STATUS_MAP[status];
        return s ? <Tag color={s.color}>{s.text}</Tag> : status;
      },
    },
    { title: "创建时间", dataIndex: "created_at", render: formatTime },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_, record) => (
        <>
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => handleEditClick(record)}
          >
            修改
          </Button>
          {record.status === 0 && (
            <>
              <Button
                type="link"
                style={{ padding: 0 }}
                onClick={() => handleApprove(record.id, true)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                style={{ padding: 0 }}
                onClick={() => handleApprove(record.id, false)}
              >
                拒绝
              </Button>
            </>
          )}
          {(record.status === 0 || record.status === 1) && (
            <Popconfirm
              title="确定取消该预约吗？"
              onConfirm={() => handleCancel(record.id)}
            >
              <Button type="link" style={{ padding: 0 }}>
                取消
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定删除该预约吗？"
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

  const fetchList = async (p: number, ps: number) => {
    setLoading(true);
    try {
      const res: any = await getReservationList({
        page: p,
        page_size: ps,
        keywords: keywords || undefined,
        status: statusFilter,
      });
      // 兼容 code 为数字/字符串，或仅以 success 标识成功
      const ok =
        res?.code === 200 || res?.code === "200" || res?.success === true;
      if (!ok) {
        message.error(res?.message || "获取预约列表失败");
        return;
      }
      // 兼容多种响应结构：{data:{items}} / {data:[...]} / {data:{data:[...]}}
      const d: any = res?.data;
      const raw = d?.items ?? d?.list ?? d?.data ?? d;
      const list: ReservationDetailResponse[] = Array.isArray(raw)
        ? (raw as ReservationDetailResponse[])
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
  }, [page, pageSize, refreshTick, statusFilter]);

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

  const handleStatusChange = (value: number | undefined) => {
    setStatusFilter(value);
    if (page !== 1) {
      setPage(1);
    } else {
      setRefreshTick((t) => t + 1);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await reservationDelete(id);
      if (res?.code !== 200) {
        message.error(res?.message || "删除预约失败");
        return;
      }
      message.success("删除预约成功");
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const handleApprove = async (id: number, approved: boolean) => {
    try {
      const res = await reservationApprove(id, approved);
      if (res?.code !== 200) {
        message.error(res?.message || "审核预约失败");
        return;
      }
      message.success("审核预约成功");
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await reservationCancel(id);
      if (res?.code !== 200) {
        message.error(res?.message || "取消预约失败");
        return;
      }
      message.success("取消预约成功");
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    }
  };

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        lab_id: values.lab_id,
        equipment_id: values.equipment_id ?? null,
        date: values.date.format("YYYY-MM-DD"),
        start_time: values.start_time.format("HH:mm"),
        end_time: values.end_time.format("HH:mm"),
        remark: values.remark,
      };
      const res = await reservationCreate(payload);
      if (res?.code !== 200) {
        message.error(res?.message || "创建预约失败");
        return;
      }
      message.success("创建预约成功");
      setModalOpen(false);
      form.resetFields();
      setCreateLabId(undefined);
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

  const handleEditClick = (record: ReservationDetailResponse) => {
    setEditing(record);
    editForm.setFieldsValue({
      date: dayjs(record.date),
      start_time: dayjs(`2000-01-01 ${record.start_time}`),
      end_time: dayjs(`2000-01-01 ${record.end_time}`),
      remark: record.remark,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!editing) return;
    setEditSubmitting(true);
    try {
      const payload = {
        date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
        start_time: values.start_time
          ? values.start_time.format("HH:mm")
          : undefined,
        end_time: values.end_time ? values.end_time.format("HH:mm") : undefined,
        remark: values.remark,
      };
      const res = await reservationUpdate(editing.id, payload);
      if (res?.code !== 200) {
        message.error(res?.message || "更新预约失败");
        return;
      }
      message.success("更新预约成功");
      setEditOpen(false);
      setRefreshTick((t) => t + 1);
    } catch {
      // 错误已由拦截器统一处理
    } finally {
      setEditSubmitting(false);
    }
  };

  const labOptions = labs.map((l) => ({ value: l.id, label: l.name }));
  const equipmentOptions = equipments.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const disabledDate = (current: Dayjs) => current.isBefore(dayjs(), "day");

  const renderFormItems = (isEdit: boolean) => (
    <>
      {!isEdit && (
        <Form.Item
          name="lab_id"
          label="实验室"
          rules={[{ required: true, message: "请选择实验室" }]}
        >
          <Select
            placeholder="请选择实验室"
            options={labOptions}
            onChange={(v) => {
              setCreateLabId(v);
              fetchEquipments(v);
              form.setFieldsValue({ equipment_id: undefined });
            }}
          />
        </Form.Item>
      )}
      {!isEdit && (
        <Form.Item name="equipment_id" label="设备（可选）">
          <Select
            placeholder="不选则只预约实验室"
            options={equipmentOptions}
            allowClear
            disabled={!createLabId}
          />
        </Form.Item>
      )}
      <Form.Item
        name="date"
        label="预约日期"
        rules={[{ required: true, message: "请选择预约日期" }]}
      >
        <DatePicker style={{ width: "100%" }} disabledDate={disabledDate} />
      </Form.Item>
      <Form.Item
        name="start_time"
        label="开始时间"
        rules={[{ required: true, message: "请选择开始时间" }]}
      >
        <DatePicker.TimePicker format="HH:mm" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="end_time"
        label="结束时间"
        rules={[{ required: true, message: "请选择结束时间" }]}
      >
        <DatePicker.TimePicker format="HH:mm" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="remark" label="备注">
        <Input.TextArea rows={3} placeholder="请输入备注" />
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
            setCreateLabId(undefined);
            setModalOpen(true);
          }}
        >
          新建预约
        </Button>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={handleStatusChange}
          options={Object.entries(STATUS_MAP).map(([v, s]) => ({
            value: Number(v),
            label: s.text,
          }))}
        />
        <Input.Search
          placeholder="搜索实验室名称、备注"
          allowClear
          style={{ width: 240 }}
          onSearch={handleSearch}
        />
      </div>
      <Table<ReservationDetailResponse>
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
        title="新建预约"
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
        title="修改预约"
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

export default Reservation;
