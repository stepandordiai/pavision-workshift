import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import classNames from "classnames";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import "./styles.scss";

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
	const [error, setError] = useState<Error | string | null>(null);
	const [clients, setClients] = useState<Client[]>([]);
	const [client, setClient] = useState<Client>(initClient);
	const [formVisible, setFormVisible] = useState(false);
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [clientEditable, setClientEditable] = useState(false);
	const [deleteInput, setDeleteInput] = useState("");

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

	const deleteClient = async () => {
		if (deleteInput !== "Alex please, don't break the program") {
			setError("Please, enter correct sentence.");
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const { error } = await supabase
				.from("clients")
				.delete()
				.eq("id", client.id);

			if (error) throw error;

			setClients((prev) => prev.filter((c) => c.id !== client.id));

			setClient(initClient);
			setDeleteModalVisible(false);
			setDeleteInput("");
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

	return (
		<>
			<form
				className={classNames("clients__form", {
					"clients__form--visible": formVisible,
				})}
				onSubmit={(e) => {
					e.preventDefault();
					handleForm();
				}}
			>
				<p style={{ fontSize: "1.5rem" }}>
					{clientEditable ? "Update client" : "Add new client"}
				</p>
				<div>
					<label htmlFor="name">Name</label>
					<input
						className="clients__input"
						onChange={(e) => handleFormOnChange(e.target.name, e.target.value)}
						value={client.name || ""}
						name="name"
						id="name"
						type="text"
						placeholder="Name"
						required
					/>
				</div>
				<div>
					<label htmlFor="address">Address</label>
					<input
						className="clients__input"
						onChange={(e) => handleFormOnChange(e.target.name, e.target.value)}
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
						className="clients__input"
						onChange={(e) => handleFormOnChange(e.target.name, e.target.value)}
						value={client.tel || ""}
						name="tel"
						id="tel"
						type="text"
						placeholder="Tel"
					/>
				</div>
				<div className="clients__form-btn-container">
					<button
						className="clients__form-cancel-btn"
						type="button"
						onClick={() => {
							setFormVisible(false);
							setClient(initClient);
							setClientEditable(false);
						}}
					>
						Cancel
					</button>
					<button className="clients__form-submit-btn" type="submit">
						{loading
							? clientEditable
								? "Updating..."
								: "Saving..."
							: clientEditable
								? "Update"
								: "Save"}
					</button>
				</div>
			</form>
			<div
				className={classNames("clients__delete-modal", {
					"clients__delete-modal--visible": deleteModalVisible,
				})}
			>
				<p style={{ fontSize: "1.5rem" }}>Delete client</p>
				<p style={{ color: "var(--red-clr)" }}>
					{error && (typeof error === "string" ? error : error.message)}
				</p>
				<p>
					Are you absolutely sure you want to delete this client{" "}
					<span style={{ fontWeight: "500" }}>{client.name}</span>?
				</p>
				<p>
					Type in the sentence "
					<span style={{ color: "var(--primary-clr)" }}>
						Alex please, don't break the program
					</span>
					" below.
				</p>
				<input
					className="clients__input"
					onChange={(e) => setDeleteInput(e.target.value)}
					type="text"
					value={deleteInput}
					required
				/>
				<div>
					<button
						onClick={() => {
							setDeleteModalVisible(false);
							setClient(initClient);
							setDeleteInput("");
						}}
						disabled={loading}
					>
						Cancel
					</button>
					<button disabled={loading} onClick={deleteClient}>
						{loading ? "Deleting..." : "Delete"}
					</button>
				</div>
			</div>
			<div
				onClick={() => {
					setFormVisible(false);
					setClientEditable(false);
					setClient(initClient);
				}}
				className={classNames("curtain", {
					"curtain--visible": formVisible || deleteModalVisible,
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
							<div className="clients__btn-container">
								<button
									className="clients__edit-btn"
									onClick={() => {
										setFormVisible(true);
										setClient(client);
										setClientEditable(true);
									}}
								>
									Edit
								</button>
								<button
									className="clients__delete-btn"
									// onClick={() => deleteClient(client.id)}
									onClick={() => {
										setClient(client);
										setDeleteModalVisible(true);
									}}
								>
									Delete
								</button>
							</div>
							<div>
								<p className="clients__label">Name</p>
								<p className="clients__details">{client.name ?? ""}</p>
								<p className="clients__label">Address</p>
								<p className="clients__details">{client.address ?? ""}</p>
								<p className="clients__label">Tel</p>
								<p className="clients__details">{client.tel ?? ""}</p>
							</div>
						</div>
					);
				})}
			</section>
			<StatusIndicator loading={loading} error={error} />
		</>
	);
}
