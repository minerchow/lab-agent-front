import {
  EquipmentCreateRequest,
  EquipmentListResponse,
  EquipmentUpdateRequest,
} from "@/types/equipment";
import { BaseResponse } from "@/types/base";
import { get, post } from "@/utils/http";
import { tauthtsBase } from "@/config";

export const getEquipmentList = (params: {
  page: number;
  page_size: number;
  keywords?: string;
  lab_id?: number;
}): Promise<BaseResponse<EquipmentListResponse>> => {
  return get({
    url: `${tauthtsBase()}/api/equipments/list`,
    params: params,
  });
};

export const equipmentCreate = (
  data: EquipmentCreateRequest
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/equipments/create`,
    data: data,
  });
};

export const equipmentUpdate = (
  id: number,
  data: EquipmentUpdateRequest
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/equipments/update/${id}`,
    data: data,
  });
};

export const equipmentDelete = async (id: number): Promise<BaseResponse> => {
  return post({ url: `${tauthtsBase()}/api/equipments/delete/${id}` });
};
