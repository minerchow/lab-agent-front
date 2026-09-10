import { BaseResponse } from "./base";
export interface historyParams {
  testAccount: number;
}
export interface Response {
  interfaceFlag: number;
  mainHistoryVersion: MainHistoryVersion;
}

export interface MainHistoryVersion {
  buyStatus: boolean;
  date: null;
  history: History[];
  maxBsj: string;
  maxMonth: string;
  maxVersion: string;
  newestBsj: string;
  newestContractCategory: string;
  newestMonth: string;
  newestOrderCategory: string;
  newestOrderSort: string;
  newestVersion: string;
  orderCategory: string;
  recover: string;
  registerDate: null;
  remainingDays: number;
  status: null;
  ucode: string;
  usertype: null;
}

export interface History {
  bsjList: string[];
  contractCategory: string[];
  month: string[];
  orderCategory: string[];
  orderSort: string[];
  purchaseTime: string[];
  typeA: string[];
  version: string;
}

export interface findUser {
  author_status: number;
  end_day: "2025-11-16";
  flag: number;
  message: string;
  register_id: number;
  status: number;
  ucode: string;
}

export interface HistoryResponse extends BaseResponse<Response> {
  data: Response;
}
export interface findUserResponse extends BaseResponse<Response> {
  data: Response;
}
