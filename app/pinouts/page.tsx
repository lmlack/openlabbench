import type { Metadata } from "next";
import Link from "next/link";
import { getBoards, signalCounts } from "@/lib/boards";
import { CATEGORY_LABELS } from "@/lib/labels";
import { signal } from "@/lib/signals";
import type { BoardCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pinouts",
  description:
    "Interactive pinout diagrams for Raspberry Pi, Arduino, ESP32, STM32, the 6502, Z80 and the DIP ICs on your bench.",
};

const ORDER: BoardCategory[] = ["sbc", "mcu-board", "mcu-chip", "ic"];

export default function PinoutsIndex() {
  const boards = getBoards();
  const groups = ORDER.map((category) => ({
    category,
    boards: boards.filter((b) => b.category === category),
  })).filter((g) => g.boards.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-4xl">Pinouts</h1>
        <p className="mt-3 text-muted">{boards.length} boards and packages.</p>
      </header>

      {groups.map((group) => (
        <section key={group.category} className="mt-10">
          <h2 className="text-center text-lg font-semibold text-fg">
            {CATEGORY_LABELS[group.category]}
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-3">
            {group.boards.map((board) => {
              const counts = signalCounts(board);
              const buses = (["i2c", "spi", "uart", "pwm", "analog"] as const).filter(
                (k) => counts[k],
              );
              return (
                <li key={board.slug} className="w-full max-w-sm sm:w-[21rem]">
                  <Link
                    href={`/pinouts/${board.slug}`}
                    className="group flex h-full flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center transition-colors hover:border-line-strong"
                  >
                    <h3 className="font-semibold leading-snug group-hover:text-accent">
                      {board.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{board.summary}</p>
                    <div className="mt-auto flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-line pt-4">
                      <span className="text-sm text-subtle">
                        {board.pins.length} pins · {board.logic}
                      </span>
                      <span className="flex gap-1">
                        {buses.map((k) => (
                          <span
                            key={k}
                            className="size-2 rounded-full"
                            style={{ background: signal(k).color }}
                            title={signal(k).label}
                          />
                        ))}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
