import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
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
            "relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left text-sm",
            "border border-gray-300 dark:border-0 dark:outline dark:outline-white/10 shadow-sm",
            "text-gray-900 dark:text-white",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="block truncate capitalize">{value}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          transition
          className={cn(
            "absolute z-10 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1",
            "text-sm shadow-lg ring-1 ring-black/5 dark:ring-0 dark:outline dark:outline-white/15 focus:outline-none",
            "transition duration-150 ease-out data-[closed]:opacity-0 data-[closed]:scale-95"
          )}
        >
          {TTS_VOICES.map((voice) => (
            <ListboxOption
              key={voice}
              value={voice}
              className={cn(
                "relative cursor-pointer select-none py-2 pl-10 pr-4",
                "text-gray-900 dark:text-white",
                "data-[focus]:bg-gray-100 dark:data-[focus]:bg-gray-700 data-[selected]:font-semibold"
              )}
            >
              {({ selected }) => (
                <>
                  <span className="block truncate capitalize">{voice}</span>
                  {selected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
