import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon } from "lucide-react"

export interface FilterDropdownOption {
  value: string
  label: string
  count?: number
  checked?: boolean
}

interface FilterDropdownProps {
  options: FilterDropdownOption[]
  buttonLabel?: string
  onChange?: (selected: string[]) => void
  label?: string
  renderOptionIcon?: (option: FilterDropdownOption) => React.ReactNode
}

export function DashedFilterButton({
  label,
  values,
  onClick,
}: {
  label: string
  values?: string[]
  onClick?: () => void
}) {
  return (
    <Button
      variant="outline"
      className={
        "border border-dashed rounded-md px-4 py-2 flex items-center gap-2 min-w-[100px] h-8"
      }
      onClick={onClick}
      type="button"
    >
      <PlusIcon className="size-4 mr-1 opacity-70" />
      <span className="text-sm font-normal text-foreground">{label}</span>
      {values && values.length > 0 && (
        <>
          <span className="mx-2 h-5 w-px bg-border inline-block" />
          <span className="flex gap-1">
            {values.map((v) => (
              <span
                key={v}
                className="bg-[#f1f5f9] dark:bg-neutral-800 px-2 py-0.5 rounded text-sm font-normal text-foreground"
              >
                {v.length > 10 ? v.slice(0, 10) + "..." : v}
              </span>
            ))}
          </span>
        </>
      )}
    </Button>
  )
}

export function FilterDropdown({
  options,
  buttonLabel = "Filter",
  onChange,
  label,
  renderOptionIcon,
}: FilterDropdownProps) {
  const [selected, setSelected] = React.useState<string[]>(
    options.filter((o) => o.checked).map((o) => o.value)
  )

  React.useEffect(() => {
    if (onChange) {
      if (selected.length === 0) {
        onChange(["all"])
      } else {
        onChange(selected)
      }
    }
    // eslint-disable-next-line
  }, [selected])

  React.useEffect(() => {
    // Sync state if options change from outside
    setSelected(options.filter((o) => o.checked).map((o) => o.value))
    // eslint-disable-next-line
  }, [options.map((o) => o.value + o.checked).join(",")])

  const handleCheck = (value: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return [...prev, value]
      return prev.filter((v) => v !== value)
    })
  }

  const handleClear = () => setSelected([])

  // Hiển thị label các giá trị đã chọn
  const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <DashedFilterButton label={buttonLabel} values={selectedLabels} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
        {label && <DropdownMenuSeparator />}
        <div className="py-1">
          {options.map((opt) => {
            const checked = selected.includes(opt.value)
            return (
              <div
                key={opt.value}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none rounded hover:bg-accent"
                onClick={e => {
                  e.preventDefault()
                  handleCheck(opt.value, !checked)
                }}
                tabIndex={0}
                role="menuitemcheckbox"
                aria-checked={checked}
              >
                <Checkbox checked={checked} tabIndex={-1} className="mr-2" />
                {renderOptionIcon && (
                  <span className="mr-2">{renderOptionIcon(opt)}</span>
                )}
                <span className="flex-1 font-normal text-foreground text-sm">{opt.label}</span>
                {typeof opt.count === "number" && (
                  <span className="ml-2 text-xs text-muted-foreground">{opt.count}</span>
                )}
              </div>
            )
          })}
        </div>
        <DropdownMenuSeparator />
        <div
          className="py-2 text-center text-muted-foreground font-medium text-base cursor-pointer select-none hover:underline"
          onClick={handleClear}
          role="button"
          tabIndex={0}
        >
          Clear
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FilterDropdown; 