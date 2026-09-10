import { Button } from "antd";
import { useStore } from "../../store";
const Do = () => {
  const store = useStore();

  return (
    <div>
      <Button type="primary" onClick={store.countStore.increment}>
        增加+1
      </Button>
      <Button type="primary" onClick={store.countStore.decrement}>
        减少+1
      </Button>
      <Button type="primary" onClick={store.countStore.reset}>
        重置
      </Button>
    </div>
  );
};

export default Do;
