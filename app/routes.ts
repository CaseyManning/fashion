import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/authonly.tsx", [
    route("/", "routes/home.tsx", [
      index("routes/inspo.tsx"),
      route("closet", "routes/closet/closet.tsx", [
        index("routes/closet/list.tsx"),
        route(":id", "routes/closet/item.tsx"),
      ]),
      route("settings", "routes/settings.tsx"),
    ]),
    route("generate", "routes/generate.tsx"),
  ]),
  layout("routes/authnever.tsx", [
    route("register", "routes/register.tsx"),
    route("login", "routes/login.tsx"),
  ]),
  route("forgot-password", "routes/forgot-password.tsx"),
] satisfies RouteConfig;
