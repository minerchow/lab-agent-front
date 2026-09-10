/**
 * API响应类型使用示例
 *
 * 这个文件展示了如何使用基础响应接口模式
 */

import { BaseResponse, PageResponse } from "./base";

// 示例1: 用户详情数据
export interface UserDetailData {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  avatar: string;
  createTime: string;
  updateTime: string;
}

// 用户详情响应 - 继承基础响应接口
export interface UserDetailResponse extends BaseResponse<UserDetailData> {
  data: UserDetailData;
}

// 示例2: 用户列表数据（分页）
export interface UserListData {
  id: number;
  username: string;
  nickname: string;
  status: number;
}

// 用户列表响应 - 使用分页响应接口
export interface UserListResponse extends PageResponse<UserListData> {
  data: {
    list: UserListData[];
    total: number;
    page: number;
    size: number;
  };
}

// 示例3: 简单的成功响应
export interface SimpleResponse extends BaseResponse {
  data: null; // 某些操作只需要返回成功状态，不需要数据
}

// 示例4: 数组数据响应
export interface MenuData {
  id: number;
  name: string;
  path: string;
  icon: string;
  children?: MenuData[];
}

export interface MenuListResponse extends BaseResponse<MenuData[]> {
  data: MenuData[];
}
