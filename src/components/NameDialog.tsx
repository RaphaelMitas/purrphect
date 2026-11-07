import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export function NameDialog({
  open,
  title,
  initial = "",
  placeholder,
  action,
  optional,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: string;
  placeholder: string;
  action: string;
  optional?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);
  const submit = () => {
    if (!optional && !name.trim()) return;
    onSubmit(name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle className="font-nunito-black">{title}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChangeText={setName}
          placeholder={placeholder}
          onSubmitEditing={submit}
          maxLength={24}
        />
        <DialogFooter>
          <Button onPress={submit} disabled={!optional && !name.trim()}>
            <Text>{action}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
