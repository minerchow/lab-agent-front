export const isApp = () => {
  if (
    window.navigator.userAgent.indexOf("Android") !== -1 ||
    window.navigator.userAgent.indexOf("IOS") !== -1
  ) {
    return true;
  }
  return false;
};
