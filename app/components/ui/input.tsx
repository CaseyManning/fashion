export function InputField({ children }: React.PropsWithChildren) {
  return <div className="flex w-full flex-col gap-1">{children}</div>;
}

export function Input({
  className,
  type,
  error,
  ...props
}: React.ComponentProps<"input"> & {
  error?: boolean;
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={`flex h-9 rounded-md bg-zinc-100 px-3 py-1 
        text-base  outline-none transition-[color,box-shadow]
         file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground 
         disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm 
        ${error && "border-destructive aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"}
        ${className}`}
      {...props}
    />
  );
}

export function InputError({ children }: React.PropsWithChildren) {
  return (
    <p className="mt-0 w-full text-left text-red-500 text-sm" role="alert">
      {children}
    </p>
  );
}
