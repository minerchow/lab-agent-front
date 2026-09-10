// export * from './count';
// stores/index.ts
import { createContext, useContext } from "react";
import CountStore from "./count";

class RootStore {
  countStore = new CountStore();
}

const rootStore = new RootStore();

// 创建 Context
const StoreContext = createContext(rootStore);

// 自定义 Hook 使用 store
export const useStore = () => {
  return useContext(StoreContext);
};

export default rootStore;
