import { BrowserRouter, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import { Provider } from "mobx-react";
import rootStore from "./store";

const AppRoutes = () => {
  return useRoutes(routes);
};

function App() {
  return (
    <Provider rootStore={rootStore}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
