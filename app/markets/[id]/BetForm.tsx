"use client";

import { Card } from "@/components/ui";
import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";

export default function BetForm() {
  return (
    <Card>
      <p className="text-xs text-zinc-500">Balance: $1000.00</p>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-4 flex flex-col gap-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Side
          </label>
          <select className="w-full max-w-[10rem] rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Amount ($)
          </label>
          <Input type="number" min={1} step={0.01} defaultValue={10} />
        </div>
        <Button type="submit" variant="primary" className="w-fit">
          Place bet
        </Button>
      </form>
    </Card>
  );
}
