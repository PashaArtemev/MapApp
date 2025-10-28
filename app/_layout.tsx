import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Карта",
        }}
      />
      <Stack.Screen
        name="marker/[id]"
        options={{
          headerShown: true,
          title: "Детали маркера",
        }}
      />
      // app/_layout.tsx
      <Stack.Screen
        name="marker-list"
        options={{
          headerShown: true,
          title: "Список маркеров",
        }}
      />
    </Stack>
  );
}
