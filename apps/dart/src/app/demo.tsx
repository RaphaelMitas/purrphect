import { Cat } from "@purrphect/ui/cat";
import { Text } from "@purrphect/ui/text";
import { Redirect, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { seedDemo } from "@/db/demo";

function Seeding() {
  const db = useSQLiteContext();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    seedDemo(db)
      .then(() => router.replace("/"))
      .catch(console.error);
  }, [db]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background">
      <Cat size={72} />
      <Text className="text-muted-foreground">Setting up the demo…</Text>
    </SafeAreaView>
  );
}

export default function Demo() {
  if (process.env.EXPO_PUBLIC_DEMO !== "1") return <Redirect href="/" />;
  return <Seeding />;
}
