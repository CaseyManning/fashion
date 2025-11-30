import { Link } from "react-router";
import type { Route } from "../routes/+types/home";

export function Sidebar({
  matches,
}: {
  matches: Route.ComponentProps["matches"];
}) {
  const currentPath = matches[matches.length - 1]?.pathname;

  const links = [
    {
      label: "Outfits",
      href: "/",
    },
    {
      label: "Closet",
      href: "/closet",
    },
    {
      label: "You",
      href: "/you",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ];
  const plainPath = currentPath?.replaceAll("/", "");

  return (
    <div className="flex flex-col items-center gap-3 p-5 w-54 bg-zinc-100">
      {links.map((link, index) => (
        <Link
          key={link.href}
          to={link.href}
          className={`p-3 px-5 w-full text-sm transition-none ${
            plainPath === link.href.replaceAll("/", "")
              ? "bg-zinc-200 text-black"
              : "bg-zinc-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
