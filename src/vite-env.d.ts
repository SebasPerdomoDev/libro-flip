/// <reference types="vite/client" />

// Esto le dice a TS cómo tratar los imports con ?url (como el worker de pdf.js)
declare module "*.mjs?url" {
  const value: string;
  export default value;
}
