'use client'

import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface DateRange {
  from?: Date
  to?: Date
}

interface DateRangeCalendarProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  className?: string
}

export function DateRangeCalendar({ value, onChange, className }: DateRangeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const handleDateClick = (date: Date) => {
    if (!value?.from || (value.from && value.to)) {
      // Start new selection
      onChange?.({ from: date, to: undefined })
    } else {
      // Complete selection
      if (date < value.from) {
        onChange?.({ from: date, to: value.from })
      } else {
        onChange?.({ from: value.from, to: date })
      }
      setIsOpen(false)
    }
  }

  const isInRange = (date: Date) => {
    if (!value?.from) return false
    if (!value.to && !hoverDate) return false

    const endDate = value.to || hoverDate
    if (!endDate) return false

    const start = value.from < endDate ? value.from : endDate
    const end = value.from < endDate ? endDate : value.from

    return date > start && date < end
  }

  const isRangeStart = (date: Date) => {
    return value?.from && isSameDay(date, value.from)
  }

  const isRangeEnd = (date: Date) => {
    return value?.to && isSameDay(date, value.to)
  }

  const formatDateRange = () => {
    if (!value?.from) return 'Select date range'
    if (!value.to) return format(value.from, 'MMM dd, yyyy')
    return `${format(value.from, 'MMM dd')} - ${format(value.to, 'MMM dd, yyyy')}`
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-[260px] justify-start text-left font-normal bg-background border-border text-foreground hover:bg-accent"
      >
        <Calendar className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">
              {/* Day Headers */}
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((date) => {
                const isCurrentMonth = isSameMonth(date, currentMonth)
                const isTodayDate = isToday(date)
                const isStart = isRangeStart(date)
                const isEnd = isRangeEnd(date)
                const isMiddle = isInRange(date)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center text-xs font-normal transition-colors relative',
                      {
                        'text-gray-400 dark:text-gray-600': !isCurrentMonth,
                        'text-gray-900 dark:text-gray-100': isCurrentMonth,
                        'bg-red-500 text-white hover:bg-red-600': isStart || isEnd,
                        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400': isMiddle && !isStart && !isEnd,
                        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold': isTodayDate && !isStart && !isEnd && !isMiddle,
                        'hover:bg-gray-100 dark:hover:bg-gray-700': isCurrentMonth && !isStart && !isEnd && !isMiddle,
                        'cursor-pointer': isCurrentMonth,
                        'cursor-not-allowed': !isCurrentMonth,
                      }
                    )}
                    disabled={!isCurrentMonth}
                  >
                    {format(date, 'd')}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}