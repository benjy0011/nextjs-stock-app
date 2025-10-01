import { useMemo, useState } from "react"
import { Button } from "../ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { Label } from "../ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import countryList from 'react-select-country-list'
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Controller } from "react-hook-form"

const CountryLabel = ({
  value,
  label
} : {
  value: string,
  label: string
}) => (
  <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      loading="lazy"
      width="20"
      height="auto"
      alt={value}
      src={`https://flagcdn.com/w20/${value.toLowerCase()}.png`}
    />
    {label}
  </>
)

const CountrySelectField = ({
  name,
  label,
  control,
  error = null,
  required = false,
} : CountrySelectProps) => {
  const [ searchVal, setSearchVal ] = useState("");
  const [open, setOpen] = useState(false);

  const countryOptions = useMemo(() => countryList().getData().filter(({ label }) => label.toLowerCase().includes(searchVal.toLowerCase()) ), [searchVal])


  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>

      <Controller
        control={control}
        name={name}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false
        }}
        render={({field}) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="select-trigger justify-start font-normal !text-gray-500 relative">
                {field.value
                  ? (
                    <CountryLabel
                      label={countryList().getLabel(field.value)}
                      value={field.value}
                    />
                  )
                  : (
                    "Select a country"
                  )
                }
                <ChevronDown className="right-3 absolute" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] bg-gray-800"
              onWheel={(e) => e.stopPropagation()}
            >
              <Command className="bg-gray-800">
                <CommandInput
                  placeholder={"Search Country"}
                  value={searchVal}
                  onValueChange={(val) => setSearchVal(val)}
                />

                <CommandList className="scrollbar-hide-default">
                  <CommandEmpty>No results found.</CommandEmpty>

                  <CommandGroup heading="Countries">
                    {countryOptions.map(( {value, label} ) => (
                      <CommandItem
                        key={label}
                        onSelect={() => {
                          field.onChange(value);
                          setOpen(false)
                        }}
                      >
                        <CountryLabel
                          label={label}
                          value={value}
                        />
                        <Check
                          className={cn(
                            "ml-auto",
                            field.value === value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}
export default CountrySelectField