import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import timeToMinutes from "../../utils/timeToMinutes";
import {
	useIsFetching,
	useIsMutating,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import * as XLSX from "xlsx-js-style";
import DownloadIcon from "../../components/icons/DownloadIcon";
import ClockIcon from "../../components/icons/ClockIcon";
import { NavLink } from "react-router-dom";
import { isValidTime, formatTime } from "../../utils/helpers";
import { validEmail, validFullName, validTel } from "../../utils/validators";
import "./Profile.scss";
import PersonIcon from "../../components/icons/PersonIcon";
import GearIcon from "../../components/icons/GearIcon";

const calculateTotal = (
	startTime: string,
	endTime: string,
	overTime?: string,
	pauseTime?: string,
) => {
	if (!isValidTime(startTime) || !isValidTime(endTime)) return "";

	const start = timeToMinutes(startTime);
	const end = timeToMinutes(endTime);

	const over = isValidTime(overTime ?? "") ? timeToMinutes(overTime!) : 0;

	const pause = isValidTime(pauseTime ?? "") ? timeToMinutes(pauseTime!) : 0;

	const totalMinutes = end - start + over - pause;

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}`;
};

const Profile = () => {
	const queryClient = useQueryClient();
	const [exportError, setExportError] = useState<string | null>(null);
	const [profileFullName, setProfileFullName] = useState<string>("");
	const [profileFullNameEditable, setProfileFullNameEditable] =
		useState<boolean>(false);
	const [profileEmail, setProfileEmail] = useState<string>("");
	const [profileEmailEditable, setProfileEmailEditable] =
		useState<boolean>(false);
	const [profileTel, setProfileTel] = useState<string>("");
	const [profileTelEditable, setProfileTelEditable] = useState<boolean>(false);

	const now = new Date();

	const currentMonth = `${now.getFullYear()}-${String(
		now.getMonth() + 1,
	).padStart(2, "0")}`;
	const [exportMonth, setExportMonth] = useState(currentMonth);

	const getMonthRange = (month: string) => {
		if (!month) {
			return {
				from: "",
				to: "",
			};
		}

		const [year, monthNumber] = month.split("-").map(Number);

		const firstDay = new Date(year, monthNumber - 1, 1);
		const lastDay = new Date(year, monthNumber, 0);

		const formatDate = (date: Date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");

			return `${year}-${month}-${day}`;
		};

		return {
			from: formatDate(firstDay),
			to: formatDate(lastDay),
		};
	};

	const { from, to } = getMonthRange(exportMonth);

	const { id } = useParams<string>();

	const fetchingCount = useIsFetching({
		queryKey: ["user-page", id],
	});

	const mutatingCount = useIsMutating({
		mutationKey: ["user-page", id],
	});

	const { data: authUser = null, error: authError } = useQuery({
		queryKey: ["user-page", id, "auth-user"],

		queryFn: async () => {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error) throw error;

			return user ? { id: user.id } : null;
		},
	});

	const { data: viewedUser = null, error: memberError } = useQuery({
		queryKey: ["user-page", id, "member"],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("members")
				.select("id, full_name, email, tel")
				.eq("id", id)
				.maybeSingle();

			if (error) throw error;

			return data;
		},

		enabled: !!id,
	});

	// TODO: LEARN THIS (fetch month shift)
	const {
		// data: fetchedMonthShifts = [],
		refetch: refetchMonthShifts,
		isFetching: monthLoading,
	} = useQuery({
		queryKey: ["user-page", id, "month-shifts", from, to],

		queryFn: async () => {
			const { data, error } = await supabase
				.from("shifts")
				.select(
					"shift_date, start_time, end_time, pause_time, over_time, work_done",
				)
				.eq("user_id", id)
				.gte("shift_date", from)
				.lte("shift_date", to)
				.order("shift_date", { ascending: true });

			if (error) throw error;

			return data ?? [];
		},

		enabled: false,
	});

	const handleExport = async () => {
		if (!exportMonth) return;
		setExportError(null);

		const result = await refetchMonthShifts();

		if (!result.data?.length) {
			setExportError("No shifts found for this month.");
			return;
		}

		exportToExcel(result.data, exportMonth);
	};

	// TODO: LEARN THIS (FETCH CLIENTS)
	const {
		data: clients = [],
		// isLoading: clientsLoading,
		// error: fetchClientsError,
	} = useQuery({
		queryKey: ["user-page", id, "clients"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("clients")
				.select("id, name, tel, address")
				.order("name");

			if (error) throw error;

			return data ?? [];
		},
	});

	// TODO: LEARN THIS
	const exportToExcel = (workshifts: any[], month: string) => {
		if (!month || !workshifts?.length) return;

		const excelData = workshifts.map((item) => ({
			Date: item.shift_date,
			"Start time": formatTime(item.start_time),
			"End time": formatTime(item.end_time),
			"Pause time": formatTime(item.pause_time),
			"Extra time": formatTime(item.over_time),

			Total: calculateTotal(
				formatTime(item.start_time),
				formatTime(item.end_time),
				formatTime(item.over_time),
				formatTime(item.pause_time),
			),
			Client:
				item.work_done
					?.filter((work: any) => work.clientId)
					.map((work: any, i: number) => {
						const client = clients.find(
							(client) => client.id === work.clientId,
						);

						return `${i + 1}) ${client?.name ?? ""}`;
					})
					.join("\r\n") ?? "",
			"Work done":
				item.work_done
					?.filter((work: any) => work.task?.trim())
					.map((work: any, i: number) => `${i + 1}) ${work.task}`)
					.join("\r\n") ?? "",
			"Time spend":
				item.work_done
					?.filter((work: any) => work.time?.trim())
					.map((work: any, i: number) => `${i + 1}) ${work.time}`)
					.join("\r\n") ?? "",
		}));

		const worksheet = XLSX.utils.json_to_sheet(excelData);

		const totalMonthMinutes = workshifts.reduce((sum, item) => {
			const total = calculateTotal(
				formatTime(item.start_time),
				formatTime(item.end_time),
				formatTime(item.over_time),
				formatTime(item.pause_time),
			);

			if (!total) return sum;

			return sum + timeToMinutes(total);
		}, 0);

		const totalMonthHours = `${Math.floor(totalMonthMinutes / 60)
			.toString()
			.padStart(2, "0")}:${(totalMonthMinutes % 60)
			.toString()
			.padStart(2, "0")}`;

		const totalRowIndex = excelData.length + 2;

		XLSX.utils.sheet_add_aoa(
			worksheet,
			[[`Total hours for month: ${totalMonthHours}`]],
			{
				origin: `I${totalRowIndex}`,
			},
		);

		const totalCell = worksheet[`I${totalRowIndex}`];

		if (totalCell) {
			totalCell.s = {
				...totalCell.s,
				font: {
					bold: true,
				},
			};
		}

		const range = XLSX.utils.decode_range(worksheet["!ref"]!);

		for (let row = range.s.r; row <= range.e.r; row++) {
			for (let col = range.s.c; col <= range.e.c; col++) {
				const cellAddress = XLSX.utils.encode_cell({
					r: row,
					c: col,
				});

				const cell = worksheet[cellAddress];

				if (cell) {
					cell.s = {
						...cell.s,
						alignment: {
							...cell.s?.alignment,
							vertical: "top",
						},
					};
				}
			}
		}

		const multilineColumns = [6, 7, 8];

		for (let row = range.s.r + 1; row <= range.e.r; row++) {
			for (const col of multilineColumns) {
				const cellAddress = XLSX.utils.encode_cell({
					r: row,
					c: col,
				});

				const cell = worksheet[cellAddress];

				if (cell) {
					cell.s = {
						...cell.s,
						alignment: {
							...cell.s?.alignment,
							vertical: "top",
							wrapText: true,
						},
					};
				}
			}
		}

		const columnWidths = Object.keys(excelData[0] ?? {}).map((key) => {
			const maxLength = Math.max(
				key.length,
				...excelData.map((row) => {
					const value = row[key as keyof typeof row];

					if (value == null) return 0;

					return String(value)
						.split("\n")
						.reduce((max, line) => Math.max(max, line.length), 0);
				}),
			);

			return {
				wch: Math.min(maxLength + 2, 80),
			};
		});

		worksheet["!cols"] = columnWidths;

		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, "Workshifts");

		XLSX.writeFile(workbook, `workshifts-${month}.xlsx`);
	};

	// TODO: LEARN THIS (saveWorkshift)
	const updateFullNameMutation = useMutation({
		mutationFn: async ({
			userId,
			fullName,
		}: {
			userId: string;
			fullName: string;
		}) => {
			if (!validFullName(fullName)) {
				throw new Error("Enter correct full name (example: John Doe)");
			}

			const { data, error } = await supabase
				.from("members")
				.update({ full_name: fullName })
				.eq("id", userId)
				.select()
				.single();

			if (error) throw error;

			return data;
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			queryClient.invalidateQueries({ queryKey: ["member", viewedUser?.id] });

			setProfileFullNameEditable(false);
		},
	});

	const updateEmailMutation = useMutation({
		mutationFn: async ({
			userId,
			email,
		}: {
			userId: string;
			email: string;
		}) => {
			if (!validEmail(email)) {
				throw new Error("Enter a valid email address");
			}

			const { data, error } = await supabase
				.from("members")
				.update({ email: email })
				.eq("id", userId)
				.select()
				.single();

			if (error) throw error;

			return data;
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			queryClient.invalidateQueries({ queryKey: ["member", viewedUser?.id] });

			setProfileEmailEditable(false);
		},
	});

	const updateTelMutation = useMutation({
		mutationFn: async ({ userId, tel }: { userId: string; tel: string }) => {
			if (!validTel(tel)) {
				throw new Error("Enter a valid phone number");
			}

			const { data, error } = await supabase
				.from("members")
				.update({ tel: tel })
				.eq("id", userId)
				.select()
				.single();

			if (error) throw error;

			return data;
		},

		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["members"] });
			queryClient.invalidateQueries({ queryKey: ["member", viewedUser?.id] });

			setProfileTelEditable(false);
		},
	});

	useEffect(() => {
		setProfileFullName(viewedUser?.full_name ?? "");
		setProfileEmail(viewedUser?.email ?? "");
		setProfileTel(viewedUser?.tel ?? "");
	}, [viewedUser]);

	const error =
		memberError ||
		exportError ||
		updateFullNameMutation.error ||
		updateEmailMutation.error ||
		updateTelMutation.error ||
		authError;

	const loading = fetchingCount > 0 || mutatingCount > 0;

	const editable = authUser?.id === viewedUser?.id;

	const handleLogout = async () => {
		await supabase.auth.signOut();
	};

	return (
		<>
			<section className="section">
				<h1>Profile</h1>
			</section>
			<section className="section">
				<div className="section__heading-container">
					<PersonIcon size={20} />
					<h2>Details</h2>
				</div>

				<div>
					<label htmlFor="">Full name</label>
					<div style={{ display: "flex", gap: "5px" }}>
						<input
							className="profile__input"
							onChange={(e) => setProfileFullName(e.target.value)}
							type="text"
							value={profileFullName}
							disabled={!profileFullNameEditable}
						/>
						{editable && (
							<>
								{profileFullNameEditable ? (
									<div style={{ display: "flex", gap: "5px" }}>
										<button
											className="profile__secondary-btn"
											onClick={() => {
												updateFullNameMutation.reset();
												setProfileFullName(viewedUser?.full_name ?? "");
												setProfileFullNameEditable(false);
											}}
										>
											Cancel
										</button>
										<button
											className="profile__primary-btn"
											onClick={() => {
												if (!viewedUser) return;

												updateFullNameMutation.mutate({
													userId: viewedUser.id,
													fullName: profileFullName,
												});
											}}
											disabled={updateFullNameMutation.isPending}
										>
											{updateFullNameMutation.isPending ? "Saving..." : "Save"}
										</button>
									</div>
								) : (
									<button
										className="profile__secondary-btn"
										onClick={() => {
											setProfileFullNameEditable(true);
										}}
									>
										Update
									</button>
								)}
							</>
						)}
					</div>
				</div>
				<div>
					<label htmlFor="">Email</label>
					<div style={{ display: "flex", gap: "5px" }}>
						<input
							className="profile__input"
							onChange={(e) => setProfileEmail(e.target.value)}
							type="email"
							value={profileEmail}
							disabled={!profileEmailEditable}
						/>
						{editable && (
							<>
								{profileEmailEditable ? (
									<div style={{ display: "flex", gap: "5px" }}>
										<button
											className="profile__secondary-btn"
											onClick={() => {
												updateEmailMutation.reset();
												setProfileEmail(viewedUser?.email ?? "");
												setProfileEmailEditable(false);
											}}
										>
											Cancel
										</button>
										<button
											className="profile__primary-btn"
											onClick={() => {
												if (!viewedUser) return;

												updateEmailMutation.mutate({
													userId: viewedUser.id,
													email: profileEmail,
												});
											}}
											disabled={updateEmailMutation.isPending}
										>
											{updateEmailMutation.isPending ? "Saving..." : "Save"}
										</button>
									</div>
								) : (
									<button
										className="profile__secondary-btn"
										onClick={() => {
											setProfileEmailEditable(true);
										}}
									>
										Update
									</button>
								)}
							</>
						)}
					</div>
				</div>
				<div>
					<label htmlFor="">Phone number</label>
					<div style={{ display: "flex", gap: "5px" }}>
						<input
							className="profile__input"
							onChange={(e) => setProfileTel(e.target.value)}
							type="tel"
							value={profileTel}
							disabled={!profileTelEditable}
						/>
						{editable && (
							<>
								{profileTelEditable ? (
									<div style={{ display: "flex", gap: "5px" }}>
										<button
											className="profile__secondary-btn"
											onClick={() => {
												updateTelMutation.reset();
												setProfileTel(viewedUser?.tel ?? "");
												setProfileTelEditable(false);
											}}
										>
											Cancel
										</button>
										<button
											className="profile__primary-btn"
											onClick={() => {
												if (!viewedUser) return;

												updateTelMutation.mutate({
													userId: viewedUser.id,
													tel: profileTel,
												});
											}}
											disabled={updateTelMutation.isPending}
										>
											{updateTelMutation.isPending ? "Saving..." : "Save"}
										</button>
									</div>
								) : (
									<button
										className="profile__secondary-btn"
										onClick={() => {
											setProfileTelEditable(true);
										}}
									>
										Update
									</button>
								)}
							</>
						)}
					</div>
				</div>
			</section>
			<section className="section">
				<div className="section__heading-container">
					<DownloadIcon size={20} />
					<h2 className="section__heading">Export</h2>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<div>
						<label className="label" htmlFor="">
							Choose export month
						</label>
						<input
							className="shifts__input"
							type="month"
							value={exportMonth}
							onChange={(e) => setExportMonth(e.target.value)}
						/>
					</div>
					<button
						className="shifts__export-btn"
						type="button"
						onClick={handleExport}
						disabled={monthLoading}
					>
						{monthLoading ? "Loading..." : "Export Excel"}
					</button>
				</div>
			</section>
			<NavLink to={`/workshifts/${id}`}>
				<section className="user-page__section">
					<div className="section__heading-container">
						<ClockIcon size={20} />
						<h2 className="section__heading">Workshift</h2>
					</div>
					<p>See workshift</p>
				</section>
			</NavLink>
			<section className="user-page__section">
				<div className="section__heading-container">
					<GearIcon size={20} />
					<h2 className="section__heading">Settings</h2>
				</div>
				<button className="logout-btn" onClick={handleLogout}>
					Sign out
				</button>
			</section>
			<StatusIndicator loading={loading} error={error} />
		</>
	);
};

export default Profile;
