import { historyParams, HistoryResponse, findUserResponse } from "@/types/test";
import { get, post } from "@/utils/http";
import { tauthtsBase, ttv } from "@/config";
export const getHistory = (params: historyParams): Promise<HistoryResponse> => {
  return get({
    url: `${tauthtsBase()}/api/v1.0/user/allHistoryMainBodyV7`,
    params: params,
  });
};

export const find = (params: {
  testAccount: number;
}): Promise<findUserResponse> => {
  return post({
    url: `${ttv()}/api/v2.0/dailyRecommen/findUserAuthorV2`,
    data: params,
  });
};
