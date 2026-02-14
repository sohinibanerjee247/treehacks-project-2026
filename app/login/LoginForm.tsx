"use client";

import { Input } from "@/components/ui";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex max-w-[16rem] flex-col gap-3"
    >
      <Input type="text" placeholder="Your name" />
      <Button type="submit" variant="primary">
        Log in
      </Button>
    </form>
  );
}
