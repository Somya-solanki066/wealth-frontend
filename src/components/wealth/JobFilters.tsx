"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { JOB_CATEGORIES, JOB_TYPES, LOCATION_TYPES } from "@/lib/wealthJobs";

export type JobFilterState = {
  search: string;
  category: string;
  jobType: string;
  locationType: string;
  budgetMin: string;
  budgetMax: string;
  urgent: boolean;
};

export const emptyFilters = (): JobFilterState => ({
  search: "",
  category: "",
  jobType: "",
  locationType: "",
  budgetMin: "",
  budgetMax: "",
  urgent: false,
});

export default function JobFilters({
  value,
  onChange,
  onApply,
}: {
  value: JobFilterState;
  onChange: (next: JobFilterState) => void;
  onApply: () => void;
}) {
  const set = (partial: Partial<JobFilterState>) => onChange({ ...value, ...partial });

  return (
    <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
      <Input
        label="Search jobs"
        value={value.search}
        onChange={(e) => set({ search: e.target.value })}
        placeholder="Search by title or keyword"
        onKeyDown={(e) => {
          if (e.key === "Enter") onApply();
        }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Category"
          value={value.category}
          onChange={(e) => set({ category: e.target.value })}
          options={[
            { label: "All", value: "" },
            ...JOB_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
          ]}
        />
        <Select
          label="Job Type"
          value={value.jobType}
          onChange={(e) => set({ jobType: e.target.value })}
          options={[
            { label: "All", value: "" },
            ...JOB_TYPES.map((t) => ({ label: t.label, value: t.value })),
          ]}
        />
        <Select
          label="Location"
          value={value.locationType}
          onChange={(e) => set({ locationType: e.target.value })}
          options={[
            { label: "All", value: "" },
            ...LOCATION_TYPES.map((t) => ({ label: t.label, value: t.value })),
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Budget min"
            value={value.budgetMin}
            onChange={(e) => set({ budgetMin: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Budget max"
            value={value.budgetMax}
            onChange={(e) => set({ budgetMax: e.target.value })}
            placeholder="5000"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-[#909090] cursor-pointer">
          <input
            type="checkbox"
            checked={value.urgent}
            onChange={(e) => set({ urgent: e.target.checked })}
            className="rounded border-[#242424]"
          />
          Urgent only
        </label>
        <Button type="button" size="sm" onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
