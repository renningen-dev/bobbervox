import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/styles";
import type { Language } from "../../types";

interface LanguageListboxProps {
  value: string;
  onChange: (value: string) => void;
  languages: Language[];
  disabled?: boolean;
  className?: string;
}

export function LanguageListbox({ value, onChange, languages, disabled, className }: LanguageListboxProps) {
  const selectedLanguage = languages.find((lang) => lang.code === value) || languages[0];

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(
            "relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left",
            "border border-gray-300 dark:border-0 dark:outline dark:outline-white/10 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="flex items-center gap-2">
            <img
              src={selectedLanguage.flag}
              alt={selectedLanguage.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-sm text-gray-900 dark:text-white">{selectedLanguage.name}</span>
          </span>
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
          {languages.map((lang) => (
            <ListboxOption
              key={lang.code}
              value={lang.code}
              className={cn(
                "relative cursor-pointer select-none py-2 pl-10 pr-4",
                "text-gray-900 dark:text-white",
                "data-[focus]:bg-gray-100 dark:data-[focus]:bg-gray-700 data-[selected]:font-semibold"
              )}
            >
              {({ selected }) => (
                <>
                  <span className="flex items-center gap-2">
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{lang.name}</span>
                  </span>
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
