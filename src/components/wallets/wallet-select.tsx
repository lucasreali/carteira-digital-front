import { useWallets } from "@/api/queries/wallets";
import { SelectInput } from "@/components/form/fields";
import { Money } from "@/domain/money";

type WalletSelectProps = {
	value: string;
	onChange: (walletId: string) => void;
	id?: string;
	invalid?: boolean;
	excludeWalletId?: string;
	withBalance?: boolean;
};

export function WalletSelect({
	value,
	onChange,
	id,
	invalid,
	excludeWalletId,
	withBalance = true,
}: WalletSelectProps) {
	const wallets = useWallets();
	const options = (wallets.data?.data ?? [])
		.filter(
			(wallet) => wallet.id !== excludeWalletId && wallet.status === "active",
		)
		.map((wallet) => ({
			value: wallet.id,
			label: withBalance
				? `${wallet.alias} · ${Money.fromCents(wallet.available_balance, wallet.currency).toString()}`
				: wallet.alias,
		}));

	return (
		<SelectInput
			id={id}
			value={value}
			onChange={onChange}
			options={options}
			invalid={invalid}
			disabled={wallets.isPending}
			placeholder={
				wallets.isPending ? "Carregando carteiras…" : "Selecione a carteira"
			}
		/>
	);
}
