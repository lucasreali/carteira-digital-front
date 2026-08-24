import {
	IconArrowsExchange,
	IconBuildingBank,
	IconCreditCard,
	IconHome,
	IconId,
	IconListDetails,
	IconQrcode,
	IconUsers,
	IconWallet,
	IconWebhook,
	type TablerIcon,
} from "@tabler/icons-react";

export type NavigationLink = {
	to: string;
	label: string;
	icon: TablerIcon;
};

export type NavigationGroup = {
	title: string;
	links: ReadonlyArray<NavigationLink>;
};

export const navigationGroups: ReadonlyArray<NavigationGroup> = [
	{
		title: "Visão geral",
		links: [
			{ to: "/inicio", label: "Início", icon: IconHome },
			{ to: "/carteiras", label: "Carteiras", icon: IconWallet },
			{ to: "/transacoes", label: "Transações", icon: IconListDetails },
		],
	},
	{
		title: "Movimentar",
		links: [
			{ to: "/transferir", label: "Transferir", icon: IconArrowsExchange },
			{ to: "/pix", label: "Pix", icon: IconQrcode },
			{ to: "/depositar", label: "Depositar", icon: IconBuildingBank },
			{ to: "/sacar", label: "Sacar", icon: IconCreditCard },
		],
	},
	{
		title: "Cadastros",
		links: [
			{ to: "/favorecidos", label: "Favorecidos", icon: IconUsers },
			{
				to: "/metodos-pagamento",
				label: "Métodos de pagamento",
				icon: IconCreditCard,
			},
			{ to: "/webhooks", label: "Webhooks", icon: IconWebhook },
		],
	},
	{
		title: "Conta",
		links: [
			{ to: "/perfil", label: "Perfil", icon: IconId },
			{ to: "/perfil/kyc", label: "Verificação (KYC)", icon: IconId },
		],
	},
];
