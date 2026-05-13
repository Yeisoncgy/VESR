type Props = {
  color?: "cyan" | "magenta" | "muted";
  pulse?: boolean;
  size?: number;
};

export function PresenceDot({ color = "cyan", pulse = false, size = 8 }: Props) {
  const cls =
    color === "cyan" ? "dot-cyan" : color === "magenta" ? "dot-magenta" : "dot-muted";
  const pulseCls = pulse
    ? color === "cyan"
      ? " dot-pulse-c"
      : color === "magenta"
      ? " dot-pulse-m"
      : ""
    : "";
  return <span className={"dot " + cls + pulseCls} style={{ width: size, height: size }} />;
}
