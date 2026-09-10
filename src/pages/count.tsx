import Display from "@/components/count/display";
import Do from "@/components/count/do";
import { Button } from "antd";
const Count = () => {
  return (
    <div>
      <Display />
      <Do />
      <Button>1</Button>
    </div>
  );
};

export default Count;
