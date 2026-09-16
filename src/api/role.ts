import { BaseResponse } from "@/types/base";
import { get } from "@/utils/http";
import { tauthtsBase } from "@/config";

export interface Role {
  id: number;
  name: string;
}

export const getRoleList = (): Promise<BaseResponse<Role[]>> => {
  return get({
    url: `${tauthtsBase()}/api/roles/all`,
  });
};
