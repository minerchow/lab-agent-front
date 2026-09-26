export interface EquipmentCreateRequest {
  lab_id: number;
  name: string;
  description?: string;
  img?: string;
  spec?: string;
  quantity?: number;
  status?: number;
}

export interface EquipmentUpdateRequest {
  lab_id?: number;
  name?: string;
  description?: string;
  img?: string;
  spec?: string;
  quantity?: number;
  status?: number;
}

export interface EquipmentResponse {
  id: number;
  lab_id: number;
  lab_name?: string | null;
  name: string;
  description?: string;
  img?: string;
  spec?: string;
  quantity: number;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentListResponse {
  items: EquipmentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
