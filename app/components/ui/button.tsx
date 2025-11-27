import type * as React from "react";

function Button({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={`bg-zinc-900 rounded-md p-2 px-4 text-white ${className}`}
      {...props}
    />
  );
}

export { Button };
