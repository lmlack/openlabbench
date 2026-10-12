import type { HighlightKey, PrimaryRole, SignalTag } from "./types";

export interface SignalMeta {
  key: HighlightKey;
  label: string;
  /** Terse legend description. */
  hint: string;
  /** Mid-tone hex that holds up on both light and dark backgrounds. */
  color: string;
}

export const PRIMARY_ROLES: Record<PrimaryRole, SignalMeta> = {
  power5: { key: "power5", label: "5 V", hint: "Regulated 5 V rail", color: "#ef4444" },
  power3: { key: "power3", label: "3.3 V", hint: "Regulated 3.3 V rail", color: "#fb923c" },
  vcc: { key: "vcc", label: "VCC", hint: "Positive supply, range on the pin", color: "#f87171" },
  vin: { key: "vin", label: "VIN", hint: "Raw / unregulated input", color: "#d97706" },
  gnd: { key: "gnd", label: "GND", hint: "Ground return", color: "#9ca3af" },
  gpio: { key: "gpio", label: "GPIO", hint: "General purpose digital I/O", color: "#22c55e" },
  ctrl: { key: "ctrl", label: "Control", hint: "Reset, enable, mode, strapping", color: "#eab308" },
  nc: { key: "nc", label: "NC", hint: "Not connected / reserved", color: "#a8a29e" },
};

export const SIGNAL_TAGS: Record<SignalTag, SignalMeta> = {
  i2c: { key: "i2c", label: "I²C", hint: "Two-wire SDA / SCL bus", color: "#3b82f6" },
  spi: { key: "spi", label: "SPI", hint: "SCK / MOSI / MISO / CS", color: "#b57cf8" },
  uart: { key: "uart", label: "UART", hint: "Asynchronous serial TX / RX", color: "#14b8a6" },
  pwm: { key: "pwm", label: "PWM", hint: "Hardware timer output", color: "#ec4899" },
  analog: { key: "analog", label: "ADC", hint: "Analog input", color: "#84cc16" },
  dac: { key: "dac", label: "DAC", hint: "Analog output", color: "#fb7185" },
  touch: { key: "touch", label: "Touch", hint: "Capacitive touch sensing", color: "#d946ef" },
  clock: { key: "clock", label: "Clock", hint: "Crystal / clock in-out", color: "#818cf8" },
};

export const ALL_SIGNALS: Record<HighlightKey, SignalMeta> = {
  ...PRIMARY_ROLES,
  ...SIGNAL_TAGS,
};

/** Legend order: supplies first, then buses, how you read a board in practice. */
export const LEGEND_ORDER: HighlightKey[] = [
  "power5",
  "power3",
  "vcc",
  "vin",
  "gnd",
  "gpio",
  "ctrl",
  "i2c",
  "spi",
  "uart",
  "pwm",
  "analog",
  "dac",
  "touch",
  "clock",
  "nc",
];

export function signal(key: HighlightKey): SignalMeta {
  return ALL_SIGNALS[key];
}

/** Every highlight key a pin responds to. */
export function pinKeys(pin: { primary: PrimaryRole; tags?: SignalTag[] }): HighlightKey[] {
  return [pin.primary, ...(pin.tags ?? [])];
}

export function isPower(role: PrimaryRole): boolean {
  return role === "power5" || role === "power3" || role === "vcc" || role === "vin";
}
