import { describe, expect, it, jest } from "@jest/globals";
import { Segmented } from "@purrphect/ui/segmented";
import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";

const OPTIONS = [
  { value: "501", label: "501" },
  { value: "custom", label: "Custom" },
] as const;
type Option = (typeof OPTIONS)[number]["value"];

async function renderSegmented(value: Option) {
  const onChange = jest.fn<(value: Option) => void>();
  const onChangeText = jest.fn<(text: string) => void>();
  await render(
    <Segmented
      options={OPTIONS}
      value={value}
      onChange={onChange}
      custom={{ value: "custom", label: "Custom start", text: "", placeholder: "1001", onChangeText }}
    />,
  );
  return { onChange, onChangeText };
}

describe("Segmented custom field", () => {
  it("shows a button, not the number field, until Custom is selected", async () => {
    const user = userEvent.setup();
    const { onChange } = await renderSegmented("501");

    expect(screen.queryByLabelText("Custom start")).not.toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Custom" }));
    expect(onChange).toHaveBeenCalledWith("custom");
  });

  it("swaps the Custom button for the number field once selected", async () => {
    await renderSegmented("custom");

    expect(screen.getByLabelText("Custom start")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Custom" })).not.toBeOnTheScreen();
  });

  it("passes on only the digits that were typed", async () => {
    const { onChangeText } = await renderSegmented("custom");

    await fireEvent.changeText(screen.getByLabelText("Custom start"), "4a0-.");
    expect(onChangeText).toHaveBeenCalledWith("40");
  });
});
