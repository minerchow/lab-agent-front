import { User } from "@/types/auth";
import { BaseResponse } from "@/types/base";
import { get, post } from "@/utils/http";
import { tauthtsBase } from "@/config";

export const getUserInfo = (): Promise<BaseResponse<User>> => {
  return get({
    url: `${tauthtsBase()}/api/users/info`,
  });
};

export const updateUserInfo = (user: User): Promise<BaseResponse<User>> => {
  return post({
    url: `${tauthtsBase()}/api/users/updateinfo`,
    data: user,
  });
};
