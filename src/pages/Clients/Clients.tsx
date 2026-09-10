import { useEffect, useState } from "react";
import "./styles.scss";
import { supabase } from "../../lib/supabase";
import classNames from "classnames";

type Client = {
	id: string;
	name: string;
	tel?: string | null;
	address?: string | null;
};

const initClient = {
	id: "",
	name: "",
	tel: "",
	address: "",
};

export default function Clients() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [clients, setClients] = useState<Client[]>([]);
	const [client, setClient] = useState<Client>(initClient);
	const [formVisible, setFormVisible] = useState(false);
	const [clientEditable, setClientEditable] = useState(false);

	// TODO:
	useEffect(() => {
		const fetchClients = async () => {
			const { data, error } = await supabase
				.from("clients")
				.select("id, name, tel, address")
				.order("name");

			if (error) {
				console.error(error);
				return;
			}

			setClients(data ?? []);
		};

		fetchClients();
	}, []);

	const addClient = async () => {
		if (!client.name.trim()) {
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { data, error } = await supabase
				.from("clients")
				.insert({
					name: client.name.trim(),
					tel: client.tel?.trim() || null,
					address: client.address?.trim() || null,
				})
				.select()
				.single();

			if (error) throw error;

			setClients((prev) => [...prev, data]);

			setClient(initClient);
			setFormVisible(false);
		} catch (error: any) {
			setError(error.message);
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const deleteClient = async (clientId: string) => {
		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase
				.from("clients")
				.delete()
				.eq("id", clientId);

			if (error) throw error;

			setClients((prev) => prev.filter((client) => client.id !== clientId));

			setFormVisible(false);
		} catch (error: any) {
			setError(error.message);
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const updateClient = async () => {
		setLoading(true);
		setError(null);
		try {
			const { data: updatedClient, error } = await supabase
				.from("clients")
				.update({
					name: client.name,
					tel: client.tel,
					address: client.address,
				})
				.eq("id", client.id)
				.select()
				.single();

			if (error) throw error;

			setClients((prev) =>
				prev.map((item) =>
					item.id === updatedClient.id ? updatedClient : item,
				),
			);

			setFormVisible(false);
			setClient(initClient);
			setClientEditable(false);
		} catch (error: any) {
			setError(error.message);
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleFormOnChange = (name: string, value: string) => {
		setClient((prev) => ({ ...prev, [name]: value }));
	};

	const handleForm = async () => {
		if (clientEditable) {
			await updateClient();
		} else {
			await addClient();
		}
	};

	console.log(error);
	console.log(loading);

	return (
		<>
			<div
				className={classNames("clients__form", {
					"clients__form--visible": formVisible,
				})}
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleForm();
					}}
				>
					<div>
						<label htmlFor="name">Name</label>
						<input
							onChange={(e) =>
								handleFormOnChange(e.target.name, e.target.value)
							}
							value={client.name || ""}
							name="name"
							id="name"
							type="text"
							placeholder="Name"
						/>
					</div>
					<div>
						<label htmlFor="address">Address</label>
						<input
							onChange={(e) =>
								handleFormOnChange(e.target.name, e.target.value)
							}
							value={client.address || ""}
							name="address"
							id="address"
							type="text"
							placeholder="Address"
						/>
					</div>
					<div>
						<label htmlFor="tel">Tel</label>
						<input
							onChange={(e) =>
								handleFormOnChange(e.target.name, e.target.value)
							}
							value={client.tel || ""}
							name="tel"
							id="tel"
							type="text"
							placeholder="Tel"
						/>
					</div>
					<button
						type="button"
						onClick={() => {
							setFormVisible(false);
							setClient(initClient);
							setClientEditable(false);
						}}
					>
						Cancel
					</button>
					<button type="submit">
						{clientEditable ? "Update client" : "Add new client"}
					</button>
				</form>
			</div>
			<div
				onClick={() => {
					setFormVisible(false);
					setClientEditable(false);
					setClient(initClient);
				}}
				className={classNames("curtain", {
					"curtain--visible": formVisible,
				})}
			></div>
			<section className="clients__section">
				<h1 style={{ fontSize: "2rem" }}>Clients ({clients.length})</h1>
				<button onClick={() => setFormVisible(true)}>Add</button>
			</section>
			<section className="clients-grid">
				{clients.map((client) => {
					return (
						<div className="clients__client-card" key={client.id}>
							<div>
								<p>Name: {client.name ? client.name : "Unknown"}</p>
								<p>Address: {client.address ? client.address : "Unknown"}</p>
								<p>Tel: {client.tel ? client.tel : "Unknown"}</p>
							</div>
							<div>
								<button
									onClick={() => {
										setFormVisible(true);
										setClient(client);
										setClientEditable(true);
									}}
								>
									Edit
								</button>
								<button onClick={() => deleteClient(client.id)}>Delete</button>
							</div>
						</div>
					);
				})}
			</section>
		</>
	);
}
