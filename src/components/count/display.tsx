import React from "react";
import { useStore } from "@/store";
import { observer } from "mobx-react";

const Display = () => {
  const store = useStore();

  return (
    <div>
      <p>当前计数: {store.countStore.count}</p>
    </div>
  );
};
export default React.memo(observer(Display));
