import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/pix/cobrancas/$chargeId")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_app/pix/cobrancas/$chargeId"!</div>;
}
