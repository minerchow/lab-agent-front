export interface ReservationCreateRequest {
  lab_id: number;
  equipment_id?: number | null;
  date: string;
  start_time: string;
  end_time: string;
  remark?: string | null;
}

export interface ReservationUpdateRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  remark?: string | null;
}

export interface ReservationResponse {
  id: number;
  user_id: number;
  lab_id: number;
  equipment_id?: number | null;
  date: string;
  start_time: string;
  end_time: string;
  remark?: string | null;
  status: number; // 0 待审核，1 已通过，2 已拒绝，3 已取消
  created_at?: string;
  updated_at?: string;
}

export interface ReservationDetailResponse extends ReservationResponse {
  user_name?: string | null;
  lab_name?: string | null;
  equipment_name?: string | null;
}

export interface ReservationListResponse {
  items: ReservationDetailResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
