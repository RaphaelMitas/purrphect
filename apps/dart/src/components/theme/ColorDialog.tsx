import { Button } from "@purrphect/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@purrphect/ui/dialog";
import { cn } from "@purrphect/ui/lib/utils";
import { Segmented } from "@purrphect/ui/segmented";
import { Slider } from "@purrphect/ui/slider";
import { Text } from "@purrphect/ui/text";
import { hexToHsl, hslToHex, type Theme } from "@purrphect/ui/theme";
import { useState } from "react";
import { View } from "react-native";
import { ColorSwatches } from "@/components/ColorSwatches";
import { useT } from "@/i18n/LanguageProvider";
import { isAuto, type RoleInfo, roleColor } from "@/lib/themes";

const HUES = [0, 60, 120, 180, 240, 300, 359];

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
  role: RoleInfo;
  theme: Theme;
  portalHost: string;
  onChange: (patch: Partial<Theme>) => void;
  onClose: () => void;
}) {
  const t = useT();
  const color = roleColor(theme, role.key);
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const [h, s, l] = hsl;
  const auto = isAuto(theme, role.key);
  const set = (value: string | undefined) => onChange({ [role.key]: value });
  const tune = (next: [number, number, number]) => {
    setHsl(next);
    set(hslToHex(...next));
  };
  const pick = (swatch: string) => {
    setHsl(hexToHsl(swatch));
    set(swatch);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent portalHost={portalHost} className="w-96 rounded-3xl bg-card">
        <DialogHeader className="flex-row items-center gap-3">
          <View className="size-11 rounded-full border-2 border-border" style={{ backgroundColor: color }} />
          <View className="flex-1">
            <DialogTitle className="font-nunito-black">{t.theme.roles[role.key].name}</DialogTitle>
            <Text className="text-xs text-muted-foreground">{t.theme.roles[role.key].use}</Text>
          </View>
        </DialogHeader>
        {role.auto && (
          <View className="gap-1">
            <Segmented
              options={[
                { value: "auto", label: t.theme.auto },
                { value: "custom", label: t.custom },
              ]}
              value={auto ? "auto" : "custom"}
              onChange={(v) => (v === "auto" ? set(undefined) : pick(color))}
            />
            <Text className="px-1 text-xs text-muted-foreground">{auto ? t.theme.autoHint : t.theme.fixedHint}</Text>
          </View>
        )}
        <View className={cn("gap-4", auto && "opacity-40")} pointerEvents={auto ? "none" : "auto"}>
          <ColorSwatches colors={role.auto ? NEUTRALS : COLORS} value={color} onChange={pick} />
          <View className="gap-3">
            <Text className="font-nunito-black text-sm">{t.theme.fineTune}</Text>
            <Slider
              label={t.theme.hue}
              value={Math.round(h)}
              min={0}
              max={359}
              colors={HUES.map((hue) => hslToHex(hue, 80, 65))}
              onChange={(hue) => tune([hue, s, l])}
            />
            <Slider
              label={t.theme.shade}
              value={Math.round(l)}
              min={2}
              max={98}
              colors={[hslToHex(h, s, 2), hslToHex(h, s, 50), hslToHex(h, s, 98)]}
              onChange={(lightness) => tune([h, s, lightness])}
            />
          </View>
        </View>
        <DialogFooter>
          <Button onPress={onClose}>
            <Text>{t.theme.done}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
