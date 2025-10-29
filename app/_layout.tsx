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
    </Stack>
  );
}
