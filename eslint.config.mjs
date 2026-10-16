import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: [".next/**", ".next-pre-next16/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
