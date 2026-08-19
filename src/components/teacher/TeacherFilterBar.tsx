"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ERROR_REASONS, asList } from "@/lib/constants";

type Option = { id: string; name: string };

function FilterSelect({
  paramKey,
  label,
  options,
}: {
  paramKey: string;
  label: string;
  options: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramKey, value);
    else params.delete(paramKey);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      aria-label={label}
      value={searchParams.get(paramKey) ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border bg-card px-3 py-2 text-sm"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

export function TeacherFilterBar({
  classes,
  students,
}: {
  classes: Option[];
  students: Option[];
}) {
  const errorReasonOptions = asList(ERROR_REASONS).map((item) => ({
    id: item.value,
    name: item.label,
  }));

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect paramKey="reason" label="Hata nedeni" options={errorReasonOptions} />
      <FilterSelect paramKey="classId" label="Sınıf" options={classes} />
      <FilterSelect paramKey="studentId" label="Öğrenci" options={students} />
    </div>
  );
}
