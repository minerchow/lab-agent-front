import {
  ReservationCreateRequest,
  ReservationListResponse,
  ReservationUpdateRequest,
} from "@/types/reservation";
import { BaseResponse } from "@/types/base";
import { get, post } from "@/utils/http";
import { tauthtsBase } from "@/config";

export const getReservationList = (params: {
  page: number;
  page_size: number;
  user_id?: number;
  lab_id?: number;
  status?: number;
  keywords?: string;
}): Promise<BaseResponse<ReservationListResponse>> => {
  return get({
    url: `${tauthtsBase()}/api/reservations/list`,
    params: params,
  });
};

export const getReservationDetail = (
  id: number
): Promise<BaseResponse<ReservationListResponse["items"][number]>> => {
  return get({ url: `${tauthtsBase()}/api/reservations/detail/${id}` });
};

export const reservationCreate = (
  data: ReservationCreateRequest
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/reservations/create`,
    data: data,
  });
};

export const reservationUpdate = (
  id: number,
  data: ReservationUpdateRequest
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/reservations/update/${id}`,
    data: data,
  });
};

export const reservationDelete = async (id: number): Promise<BaseResponse> => {
  return post({ url: `${tauthtsBase()}/api/reservations/delete/${id}` });
};

export const reservationApprove = (
  id: number,
  approved: boolean
): Promise<BaseResponse> => {
  return post({
    url: `${tauthtsBase()}/api/reservations/approve/${id}`,
    config: { params: { approved } },
  });
};

export const reservationCancel = async (id: number): Promise<BaseResponse> => {
  return post({ url: `${tauthtsBase()}/api/reservations/cancel/${id}` });
};
