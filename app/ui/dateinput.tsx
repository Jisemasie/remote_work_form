// ui/DateInput.tsx

"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  name: string;
};

export default function DateInput({ label, selected, onChange, name }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <DatePicker
        id={name}
        selected={selected}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}