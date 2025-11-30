import { useEffect } from "react";
import { useNavigate } from "react-router";

export interface LightboxCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  closeOnEscape?: boolean;
}

export function LightboxCard({
  children,
  closeOnEscape = false,
  ...props
}: LightboxCardProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!closeOnEscape) return;
    const listener = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [navigate]);

  return (
    <div
      className="flex flex-row fixed top-0 left-0 w-full bg-zinc-100 z-10 h-screen"
      {...props}
    >
      <div className="flex flex-row gap-4 bg-white m-10 rounded-md p-4 w-full border border-zinc-200 shadow-xl/5 relative">
        {children}
      </div>
    </div>
  );
}
