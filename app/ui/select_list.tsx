// components/SelectWrapper.tsx
'use client'

import { SelectList } from '../lib/definitions'
import React from 'react'

interface SelectWrapperProps {
  label: string
  name: string
  options: SelectList[] | null
  value: string
  isDisabled?: boolean
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
}

export default function SelectWrapper({ label, name, value, options, isDisabled = false,  onChange }: SelectWrapperProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        name={name}
        value={value}
        disabled={isDisabled}
        onChange={onChange}
        className="input"
      >
        <option value="0">
          Sélectionner
        </option>
        {options?.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.value}
          </option>
        ))}
      </select>
    </div>
  )
}
