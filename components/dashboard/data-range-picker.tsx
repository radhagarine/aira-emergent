import React from 'react'
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function CalendarDateRangePicker({
  className,
  date = {
    from: new Date(2023, 0, 20),
    to: new Date(2023, 1, 9),
  },
  setDate,
}: {
  className?: string
  date?: DateRange | undefined
  setDate?: (date: DateRange | undefined) => void
} = {}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start bg-white text-left font-normal hover:bg-gray-50",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span className="text-gray-500">Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          className="rounded-md border bg-white p-3 shadow-md"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium text-gray-900",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 hover:opacity-70 transition-opacity",
              "text-gray-500 hover:text-gray-900"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            ),
            day: cn(
              "h-9 w-9 p-0 font-normal",
              "aria-selected:opacity-100 hover:bg-gray-100 aria-selected:bg-[#8B0000] aria-selected:text-white",
              "rounded-md transition-colors"
            ),
            day_today: "bg-gray-100",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-[#8B0000] aria-selected:text-white",
            day_selected: "bg-[#8B0000] text-white hover:bg-[#6B0000]",
            day_range_start: "rounded-l-md",
            day_range_end: "rounded-r-md",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}