import { login } from "@/api/auth";
import { find, getHistory } from "@/api/test";
import CookieUtil from "@/utils/cookie";
import { Button } from "antd";
import "./index.scss";
export default function Index() {
  const logins = async () => {
    const res = await login({
      client_id: "qh-tesla-app",
      deviceId: "18171adc022bf26d4fd",
      grant_type: "password",
      mark: 1,
      password: "123456",
      username: "13166356025",
    });

    if (res.code === 200) {
      const refreshTokenExpireTime = CookieUtil.getTokenExpireTime(
        res.data.refresh_token
      );
      if (refreshTokenExpireTime > 0) {
        CookieUtil.setCookie(
          "refreshtoken",
          res.data.refresh_token,
          refreshTokenExpireTime
        );
      }
      const accessTokenExpireTime = CookieUtil.getTokenExpireTime(
        res.data.access_token
      );
      if (accessTokenExpireTime > 0) {
        CookieUtil.setCookie(
          "accesstoken",
          res.data.access_token,
          accessTokenExpireTime
        );
      }
    }
  };
  const getHistoryCall = async () => {
    const res = await getHistory({
      testAccount: 0,
    });
    console.log("res", res);
  };
  const finds = async () => {
    const res = await find({
      testAccount: 0,
    });
    console.log("res", res);
  };
  return (
    <div className="index-page">
      <div className="text">222</div>
      <Button className="btns">123</Button>
      <Button className="btns" onClick={logins}>
        登录
      </Button>
      <Button className="btns" onClick={getHistoryCall}>
        获取历史
      </Button>
      <Button className="btns" onClick={finds}>
        查找
      </Button>
    </div>
  );
}
