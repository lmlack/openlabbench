/** A pin's primary electrical role. Drives the pin's fill color. */
export type PrimaryRole =
  | "power5"
  | "power3"
  | "vcc"
  | "vin"
  | "gnd"
  | "gpio"
  | "ctrl"
  | "nc";

/**
 * Capabilities a pin can expose on top of its primary role. A GPIO pin is
 * routinely also an I2C, SPI, UART, PWM or ADC pin, so these are tags rather
 * than mutually exclusive categories.
 */
export type SignalTag =
  | "i2c"
  | "spi"
  | "uart"
  | "pwm"
  | "analog"
  | "dac"
  | "touch"
  | "clock";

export type HighlightKey = PrimaryRole | SignalTag;

export interface Pin {
  /** Physical pin number, when the package has one. */
  number?: number;
  /** Primary silkscreen / datasheet label, e.g. "GPIO2", "D13", "THRES". */
  name: string;
  primary: PrimaryRole;
  /**
   * The pin on the board's main chip that this header pin is wired to, when
   * that is the number people actually type: the FPGA pin in a constraint
   * file. Shown in its own column, headed by `Board.chipPinLabel`.
   */
  chipPin?: number;
  /** Other names the same pin is known by, used for search. */
  aliases?: string[];
  tags?: SignalTag[];
  /** Peripheral mappings, e.g. "I2C1 SDA", "SPI0 SCK", "Timer2 OC2B". */
  functions?: string[];
  /** Voltage or logic level worth calling out on the pin itself. */
  voltage?: string;
  /** A gotcha: boot strapping, input-only, on-board pull-up, current limit. */
  note?: string;
  /** Explicit placement; otherwise derived from `number` + layout.numbering. */
  side?: "left" | "right";
  row?: number;
}

export type LayoutKind = "header" | "board" | "dip";

export interface Layout {
  kind: LayoutKind;
  /**
   * How physical pin numbers map onto the two columns.
   *  - zigzag: odd pins down the left, even pins down the right (2xN headers)
   *  - ccw:    1..N/2 down the left, then N/2+1..N back up the right (DIP, Pico)
   *  - explicit: every pin carries its own side/row
   */
  numbering: "zigzag" | "ccw" | "explicit";
  rows: number;
  sideLabels?: [string, string];
}

export interface DocLink {
  label: string;
  url: string;
}

export type BoardCategory = "sbc" | "mcu-board" | "mcu-chip" | "ic";

/**
 * A short, concrete bring-up snippet for one board: the register writes that
 * turn a pin number on the diagram into a configured pin. Deliberately not a
 * tutorial. The value is the step people forget, which is different on every
 * family: the clock enable on STM32, TRIS and ADCON1 on PIC, DDR on AVR.
 */
export interface Snippet {
  /** What it does, in a few words. "Blink the on-board LED." */
  title: string;
  /** Toolchain the code is written against, e.g. "avr-libc", "Pico SDK". */
  toolchain: string;
  /** C unless a part has no C compiler worth naming. */
  lang: "c" | "asm";
  code: string;
  /** The one thing that bites people. Required: a snippet without it is a tutorial. */
  gotcha: string;
}

/** How a component is drawn in the generated schematic. */
export type CircuitSymbol = "cap" | "res" | "xtal" | "link" | "cell" | "osc" | "load";

/**
 * Endpoints that are not a pin on this chip. VCC and GND are the supply rails.
 * MCU is whatever drives the part and VM a second, higher supply, both drawn
 * as off-chip terminals: a motor rail is not the logic rail.
 */
export type CircuitNet = "VCC" | "GND" | "MCU" | "VM";

/**
 * One external component. `from` and `to` are machine-readable endpoints: a pin
 * number as a string, or a net name. The schematic is drawn from these, so the
 * picture cannot drift from the table or from the pinout.
 */
export interface CircuitPart {
  /** What it is, with a value. "100 nF ceramic", "10 kOhm". */
  part: string;
  symbol: CircuitSymbol;
  /** Pin number as a string, or a CircuitNet name. */
  from: string;
  to: string;
  /** false = strongly recommended rather than required to function. */
  required: boolean;
  why: string;
}

/**
 * The parts you have to add around a chip before it does anything. Both the
 * table and the schematic render from the same rows, so they cannot disagree.
 */
export interface Circuit {
  title: string;
  parts: CircuitPart[];
  note?: string;
}

export interface Board {
  slug: string;
  name: string;
  shortName: string;
  vendor: string;
  category: BoardCategory;
  summary: string;
  /** Logic level, e.g. "3.3 V". The single most consulted spec on a bench. */
  logic: string;
  package: string;
  /** Heading for the `Pin.chipPin` column, e.g. "FPGA pin". Required with chipPin. */
  chipPinLabel?: string;
  layout: Layout;
  pins: Pin[];
  notes?: string[];
  docs?: DocLink[];
  /** Bring-up code, at most a couple of snippets. */
  snippets?: Snippet[];
  /** External parts needed to make the chip run. */
  circuit?: Circuit;
  /** Search keywords beyond the name, e.g. board nicknames and part numbers. */
  keywords?: string[];
}

/** A pin with its resolved grid position. */
export interface PlacedPin extends Pin {
  side: "left" | "right";
  row: number;
}

export type Confidence = "drop-in" | "caveats" | "not-drop-in";

export interface Equivalent {
  part: string;
  confidence: Confidence;
  /** Why it is or isn't a straight swap. Required, a bare list of part
   *  numbers is what makes forum threads useless. */
  notes: string;
}

export type PartCategory =
  | "microcontroller"
  | "transceiver"
  | "sensor"
  | "logic"
  | "regulator"
  | "analog"
  | "driver"
  | "interface"
  | "discrete";

export interface Part {
  part: string;
  category: PartCategory;
  summary: string;
  /** Short spec chips shown in the results row. */
  specs: Record<string, string>;
  equivalents: Equivalent[];
  /** Links a pinout page on this site, when we have one. */
  pinout?: string;
  keywords?: string[];
}
