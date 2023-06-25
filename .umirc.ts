import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/", redirect: '/serial-terminal' },
    { path: "/serial-terminal", component: "serial-terminal" },
  ],
  npmClient: 'yarn',
});
