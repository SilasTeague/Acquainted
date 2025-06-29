'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarProps {
  value: Date;
  onChange: (date: Date) => void;
  tileContent?: (props: { date: Date }) => React.ReactNode;
}

export default function Calendar({ value, onChange, tileContent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const isSelected = isSameDay(day, value);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div
              key={day.toISOString()}
              className={`
                relative p-2 text-center cursor-pointer border rounded
                ${isSelected ? 'bg-green-600 text-white' : ''}
                ${!isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-100'}
                ${isCurrentMonth && !isSelected ? 'text-gray-900' : ''}
              `}
              onClick={() => onChange(day)}
            >
              <span>{format(day, 'd')}</span>
              {tileContent && tileContent({ date: day })}
            </div>
          );
        })}
      </div>
    </div>
  );
} 