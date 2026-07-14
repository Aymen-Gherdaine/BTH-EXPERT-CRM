import next from "eslint-config-next";

// eslint-config-next 16 fournit une flat config native (core-web-vitals +
// typescript + jsx-a11y). On l'étend et on assouplit quelques règles pour ne
// pas bloquer sur un codebase existant.
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "supabase/**",
      "next-env.d.ts",
    ],
  },
  ...(Array.isArray(next) ? next : [next]),
  {
    // Sur ce codebase existant, on rétrograde en avertissements les règles très
    // strictes de React 19 (compiler) et l'échappement d'entités : visibles mais
    // non bloquantes, à nettoyer progressivement.
    rules: {
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];
