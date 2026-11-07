/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/*.test.tsx"],
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|nativewind|react-native-css-interop|@rn-primitives/.*|lucide-react-native))",
  ],
};
