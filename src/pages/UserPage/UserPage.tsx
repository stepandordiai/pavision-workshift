import Weekbar from "../../components/Weekbar/Weekbar";
import { useParams } from "react-router-dom";
import Visit from "../../components/Visit/Visit";
import { supabase } from "../../lib/supabase";
import { useState } from "react";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import timeToMinutes from "../../utils/timeToMinutes";
import "./UserPage.scss";
import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx-js-style";

const toLocalDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

// TODO:
const isValidTime = (time?: string) => {
	return /^([01]\d|2[0-3]):[0-5]\d$/.test(time || "");
};

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

const formatTime = (time?: string | null) => {
	if (!time) return "";

	const [hours, minutes] = time.split(":");

	return `${hours}:${minutes}`;
};

const UserPage = () => {
	const today = new Date();

	const [shiftDate, setShiftDate] = useState(toLocalDateString(today));

	const [isWeek, setIsWeek] = useState(false);
	const [isMonth, setIsMonth] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);
	const [workShiftError, setWorkShiftError] = useState<Error | null>(null);

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

	const loading = fetchingCount > 0 || mutatingCount > 0;

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
				.select("id, full_name")
				.eq("id", id)
				.maybeSingle();

			if (error) throw error;

			return data;
		},

		enabled: !!id,
	});

	const error = authError || memberError || workShiftError || exportError;

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

	return (
		<>
			<section className="section">
				<h1 style={{ fontSize: "2rem" }}>{viewedUser?.full_name}</h1>
			</section>
			<section className="shifts__section">
				<input
					className="shifts__input"
					type="month"
					value={exportMonth}
					onChange={(e) => setExportMonth(e.target.value)}
				/>
				<button
					className="shifts__export-btn"
					type="button"
					onClick={handleExport}
					disabled={monthLoading}
				>
					{monthLoading ? "Loading..." : "Export Excel"}
				</button>
			</section>
			<Weekbar
				shiftDate={shiftDate}
				setShiftDate={setShiftDate}
				isWeek={isWeek}
				setIsWeek={setIsWeek}
				isMonth={isMonth}
				setIsMonth={setIsMonth}
			/>

			<Visit
				userId={id}
				currentUser={authUser}
				shiftDate={shiftDate}
				isWeek={isWeek}
				isMonth={isMonth}
				onError={setWorkShiftError}
			/>

			<StatusIndicator loading={loading} error={error} />
		</>
	);
};

export default UserPage;
