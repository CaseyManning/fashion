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
      label: "Settings",
      href: "/settings",
    },
  ];
  const plainPath = currentPath?.replaceAll("/", "");

  return (
    <div className="flex flex-col items-center gap-3 w-36 mt-36">
      {links.map((link, index) => (
        <Link
          key={link.href}
          to={link.href}
          className={`p-3 px-5 w-full text-sm transition-none ${
            plainPath === link.href.replaceAll("/", "")
              ? "bg-zinc-950 text-white"
              : "bg-zinc-100"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
