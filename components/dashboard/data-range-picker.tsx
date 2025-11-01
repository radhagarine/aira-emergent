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
}) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        id="date"
        variant={"outline"}
        className={cn(
          "w-[300px] justify-start bg-white text-left font-normal hover:bg-gray-50",
          className
        )}
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
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

      {isCalendarOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsCalendarOpen(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[320px]">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                setDate?.(newDate);
                setIsCalendarOpen(false);
              }}
              numberOfMonths={1}
              classNames={{
                months: "flex",
                month: "space-y-4",
                caption: "flex justify-between items-center px-2 py-2",
                caption_label: "text-lg font-semibold text-gray-900 dark:text-gray-100",
                nav: "space-x-1 flex items-center",
                nav_button: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-7 w-7 border border-red-500 bg-red-500 hover:bg-red-600 text-white",
                nav_button_previous: "",
                nav_button_next: "",
                table: "w-full",
                head_row: "flex",
                head_cell: "text-gray-900 dark:text-gray-100 font-medium text-sm h-10 w-10 flex items-center justify-center",
                row: "flex",
                cell: "h-10 w-10 p-0 relative focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal text-gray-900 dark:text-gray-100 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center cursor-pointer border-0 bg-transparent",
                day_range_end: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:text-white",
                day_range_start: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:text-white",
                day_selected: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 focus:text-white",
                day_today: "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-400 font-semibold",
                day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                day_disabled: "text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed",
                day_range_middle: "bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-400",
                day_hidden: "invisible",
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}