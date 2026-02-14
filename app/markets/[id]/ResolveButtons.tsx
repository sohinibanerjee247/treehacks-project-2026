"use client";

import { Card } from "@/components/ui";
import Button from "@/components/ui/Button";

export default function ResolveButtons() {
  return (
    <Card>
      <p className="text-xs text-zinc-500">
        Resolve this market when the outcome is known.
      </p>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="primary">
          Resolve Yes
        </Button>
        <Button type="button" variant="danger">
          Resolve No
        </Button>
      </div>
    </Card>
  );
}
