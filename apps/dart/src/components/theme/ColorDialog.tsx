import { Button } from "@purrphect/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@purrphect/ui/dialog";
import { cn } from "@purrphect/ui/lib/utils";
import { Segmented } from "@purrphect/ui/segmented";
import { Slider } from "@purrphect/ui/slider";
import { Text } from "@purrphect/ui/text";
import { hexToHsl, hslToHex, type Theme } from "@purrphect/ui/theme";
import { View } from "react-native";
import { ColorSwatches } from "@/components/ColorSwatches";
import { ROLES, type Role, roleColor } from "@/lib/themes";

const HUES = [0, 60, 120, 180, 240, 300, 360];

const COLORS = [350, 0, 15, 30, 45, 140, 160, 185, 205, 230, 260, 290].flatMap((h) => [
  hslToHex(h, 92, 71),
  hslToHex(h, 62, 47),
]);

const NEUTRALS = [20, 340, 280, 220, 160, 40].flatMap((h) => [
  hslToHex(h, 70, 97),
  hslToHex(h, 18, 16),
  hslToHex(h, 20, 8),
  hslToHex(h, 25, 3),
]);

export function ColorDialog({
  role,
  theme,
  portalHost,
  onChange,
  onClose,
}: {
  role: Role | null;
  theme: Theme;
  portalHost: string;
  onChange: (patch: Partial<Theme>) => void;
  onClose: () => void;
}) {
  const info = ROLES.find((r) => r.key === role);
  if (!info || !role) return null;
  const color = roleColor(theme, role);
  const auto = info.auto && theme[role] === undefined;
  const [h, s, l] = hexToHsl(color);
  const set = (value: string | undefined) => onChange({ [role]: value });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent portalHost={portalHost} className="w-96 rounded-3xl bg-card">
        <DialogHeader className="flex-row items-center gap-3">
          <View className="size-11 rounded-full border-2 border-border" style={{ backgroundColor: color }} />
          <View className="flex-1">
            <DialogTitle className="font-nunito-black">{info.name}</DialogTitle>
            <Text className="text-xs text-muted-foreground">{info.use}</Text>
          </View>
        </DialogHeader>
        {info.auto && (
          <View className="gap-1">
            <Segmented
              options={[
                { value: "auto", label: "Auto" },
                { value: "custom", label: "Custom" },
              ]}
              value={auto ? "auto" : "custom"}
              onChange={(v) => set(v === "auto" ? undefined : color)}
            />
            <Text className="px-1 text-xs text-muted-foreground">
              {auto ? "Follows Mood and Warmth." : "Fixed. Mood and Warmth no longer change it."}
            </Text>
          </View>
        )}
        <View className={cn("gap-4", auto && "opacity-40")} pointerEvents={auto ? "none" : "auto"}>
          <ColorSwatches colors={info.auto ? NEUTRALS : COLORS} value={color} onChange={set} />
          <View className="gap-3">
            <Text className="font-nunito-black text-sm">Fine tune</Text>
            <Slider
              label="Hue"
              value={Math.round(h)}
              min={0}
              max={360}
              colors={HUES.map((hue) => hslToHex(hue, 80, 65))}
              onChange={(hue) => set(hslToHex(hue, s, l))}
            />
            <Slider
              label="Shade"
              value={Math.round(l)}
              min={2}
              max={98}
              colors={[hslToHex(h, s, 4), color, hslToHex(h, s, 96)]}
              onChange={(lightness) => set(hslToHex(h, s, lightness))}
            />
          </View>
        </View>
        <DialogFooter>
          <Button onPress={onClose}>
            <Text>Done</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
