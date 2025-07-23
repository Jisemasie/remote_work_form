'use client'
import React from 'react'
import { SelectList } from '../lib/definitions'
interface SelectWrapperProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
label: string
options: SelectList[] | null
isDisabled?: boolean
}
const SelectWrapper = React.forwardRef<HTMLSelectElement, SelectWrapperProps>(
({ label, options, isDisabled = false, multiple, ...rest }, ref) => {
return (
<div className="space-y-1">
<label className="block text-sm font-medium text-gray-700">
{label}
</label>
<select
disabled={isDisabled}
multiple={multiple}
ref={ref}
className="input"
{...rest}
value={rest.value?.toString() || ''}
>
{!multiple && <option value="">Sélectionner</option>}
{options?.map((opt) => (
<option key={opt.key} value={opt.key}>
{opt.value}
</option>
))}
</select>
</div>
)
}
)
SelectWrapper.displayName = 'SelectWrapper'
export default SelectWrapper