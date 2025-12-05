import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { cn } from "../../lib/styles";
import type { TTSVoice } from "../../types";
import { TTS_VOICES } from "../../types";

interface VoiceListboxProps {
  value: TTSVoice;
  onChange: (value: TTSVoice) => void;
  disabled?: boolean;
}

export function VoiceListbox({ value, onChange, disabled }: VoiceListboxProps) {
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          className={cn(
            "group relative w-full cursor-pointer rounded-lg py-1.5 pl-3 pr-8 text-left text-sm",
            "bg-gray-500/10 dark:bg-white/5 backdrop-blur-xl",
            "border border-black/10 dark:border-white/10",
            "text-gray-900 dark:text-white",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-indigo-500 dark:data-[focus]:outline-white/25",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="block truncate capitalize">{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <ChevronDownIcon className="size-4 fill-gray-500 group-data-[hover]:fill-gray-700 dark:fill-white/60 dark:group-data-[hover]:fill-white" />
          </span>
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          transition
          className={cn(
            "z-10 w-[var(--button-width)] rounded-xl p-1 [--anchor-gap:4px]",
            "bg-gray-500/10 dark:bg-gray-800/80 backdrop-blur-xl",
            "border border-black/10 dark:border-white/10",
            "shadow-lg shadow-black/5 dark:shadow-none",
            "focus:outline-none",
            "transition duration-100 ease-in data-[closed]:opacity-0"
          )}
        >
          {TTS_VOICES.map((voice) => (
            <ListboxOption
              key={voice}
              value={voice}
              className={cn(
                "group flex cursor-pointer items-center gap-2 rounded-lg py-1.5 px-3 select-none",
                "text-gray-900 dark:text-white",
                "data-[focus]:bg-gray-100 dark:data-[focus]:bg-white/10"
              )}
            >
              <CheckIcon className="invisible size-4 fill-indigo-600 dark:fill-white group-data-[selected]:visible" />
              <span className="text-sm capitalize">{voice}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
