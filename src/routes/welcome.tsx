import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/welcome")({
  component: () => <Outlet />,
});
