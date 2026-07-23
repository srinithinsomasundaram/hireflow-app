import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/how-to-use")({
  component: () => <Outlet />,
});
