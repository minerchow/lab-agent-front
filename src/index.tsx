import ReactDOM from "react-dom/client";
import App from "./App";
// 注册 Service Worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', async () => {
//     try {
//       const registration = await navigator.serviceWorker.register('/sw.js');

//       // 监听更新事件
//       registration.addEventListener('updatefound', () => {
//         const newWorker = registration.installing;
//         if (newWorker) {
//           newWorker.addEventListener('statechange', () => {
//             if (newWorker.state === 'installed') {
//               // 有新版本可用
//               if (navigator.serviceWorker.controller) {
//                 console.log('New content is available; please refresh.');
//                 // 可以在这里显示一个更新提示给用户
//                 if (confirm('有新内容可用，是否刷新页面？')) {
//                   newWorker.postMessage({ type: 'SKIP_WAITING' });
//                 }
//               }
//             }
//           });
//         }
//       });

//       // 检查是否有更新
//       setInterval(async () => {
//         const reg = await navigator.serviceWorker.ready;
//         reg.update();
//       }, 86400000); // 每天检查一次
//     } catch (error) {
//       console.error('ServiceWorker registration failed:', error);
//     }
//   });

//   // 监听控制器变化，刷新页面
//   navigator.serviceWorker.addEventListener('controllerchange', () => {
//     window.location.reload();
//   });
// }
const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}
