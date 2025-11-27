import { Link } from "react-router";

export function Sidebar() {
  const links = [
    {
      label: "Inspo",
      href: "/",
    },
    {
      label: "Closet",
      href: "/closet",
    },
    {
      label: "Settings",
      href: "/closet",
    },
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      {links.map((link, index) => (
        <Link
          key={link.href}
          to={link.href}
          className={`p-2 px-5 w-full font-medium text-sm ${index === 0 ? "bg-[#EEFF42]" : "bg-zinc-100"}`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
