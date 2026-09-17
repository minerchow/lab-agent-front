export interface LabCreateRequest {
  name: string;
  location?: string;
  capacity?: number;
  open_time?: string;
  close_time?: string;
  description?: string;
  img?: string;
  status?: number;
}

export interface LabResponse {
  id: number;
  name: string;
  location?: string;
  capacity: number;
  open_time?: string;
  close_time?: string;
  description?: string;
  img?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface LabListResponse {
  items: LabResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LabUpdateRequest {
  name?: string;
  location?: string;
  capacity?: number;
  open_time?: string;
  close_time?: string;
  description?: string;
  img?: string;
  status?: number;
}
