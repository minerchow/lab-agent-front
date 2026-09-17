import {
  LabCreateRequest,
  LabListResponse,
  LabUpdateRequest,
} from "@/types/lab";
import { BaseResponse } from "@/types/base";
import { get, post } from "@/utils/http";
import { tauthtsBase } from "@/config";

export const getLabList = (params: {
  page: number;
  page_size: number;
}): Promise<BaseResponse<LabListResponse>> => {
  return get({
    url: `${tauthtsBase()}/api/labs/list`,
    params: params,
  });
};

export const labCreate = (data: LabCreateRequest): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/labs/create`,
    data: data,
  });
};

export const labUpdate = (
  id: number,
  data: LabUpdateRequest
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/labs/update/${id}`,
    data: data,
  });
};
