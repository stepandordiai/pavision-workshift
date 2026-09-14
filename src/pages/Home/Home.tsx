import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import timeToMinutes from "../../utils/timeToMinutes";
import { NavLink } from "react-router-dom";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
import ClockIcon from "../../components/icons/ClockIcon";
import "./styles.scss";

const shiftTotalMinutes = (shift: {
	start_time: string | null;
	end_time: string | null;
	pause_time: string | null;
	over_time: string | null;
}) => {
	if (!shift.start_time || !shift.end_time) return 0;

	const start = timeToMinutes(shift.start_time);
	const end = timeToMinutes(shift.end_time);
	const pause = shift.pause_time ? timeToMinutes(shift.pause_time) : 0;
	const over = shift.over_time ? timeToMinutes(shift.over_time) : 0;

	return end - start - pause + over;
};

const parseLocalDate = (dateStr: string) => {
	const [year, month] = dateStr.split("-").map(Number);
	return new Date(year, month - 1);
};

// TODO: learn this
const getMonthName = (dateStr: string) => {
	const date = parseLocalDate(dateStr);
	return date.toLocaleDateString("en-US", { month: "long" });
};

const Home = () => {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<{ id: string; full_name: string }[]>([]);
	const [memberHours, setMemberHours] = useState<Record<string, string>>({});

	const now = new Date();

	const currentMonth = `${now.getFullYear()}-${String(
		now.getMonth() + 1,
	).padStart(2, "0")}`;
	const [monthShift, setMonthShift] = useState(currentMonth);

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

	const { from, to } = getMonthRange(monthShift);

	useEffect(() => {
		const fetchMembersAndHours = async () => {
			setLoading(true);
			setError(null);

			try {
				const [
					{ data: members, error: membersError },
					{ data: shifts, error: shiftsError },
				] = await Promise.all([
					supabase.from("members").select("id, full_name"),
					supabase
						.from("shifts")
						.select("user_id, start_time, end_time, pause_time, over_time")
						.gte("shift_date", from)
						.lte("shift_date", to),
				]);

				if (membersError) throw membersError;
				if (shiftsError) throw shiftsError;

				setData(members ?? []);

				const totals: Record<string, number> = {};
				shifts?.forEach((shift) => {
					const minutes = shiftTotalMinutes(shift);
					totals[shift.user_id] = (totals[shift.user_id] ?? 0) + minutes;
				});

				const formatted: Record<string, string> = {};
				Object.entries(totals).forEach(([userId, minutes]) => {
					const hours = Math.floor(minutes / 60);
					const mins = minutes % 60;
					formatted[userId] = `${hours}:${mins.toString().padStart(2, "0")}`;
				});

				setMemberHours(formatted);
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message);
				} else {
					setError("Something went wrong");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchMembersAndHours();
	}, [monthShift]);

	return (
		<>
			<section className="section">
				<h1>Overview</h1>
			</section>
			<section className="section">
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						flexWrap: "wrap",
						gap: "5px",
					}}
				>
					<div className="section__heading-container">
						<ClockIcon size={20} />
						<h2 className="section__heading">Workshifts</h2>
					</div>
					<div>
						<label htmlFor="">Choose month to see total hours</label>
						<input
							className="overview__input"
							type="month"
							onChange={(e) => setMonthShift(e.target.value)}
							value={monthShift}
						/>
					</div>
				</div>
			</section>
			<div className="dashboard__members-grid">
				{data.map((member) => (
					<NavLink
						to={`/workshifts/${member.id}`}
						key={member.id}
						className="dashboard__member-card"
					>
						<label>{member.full_name}</label>
						<div className="dashboard__member-total">
							<span>
								Total hours {getMonthName(monthShift)}{" "}
								{parseLocalDate(monthShift).getFullYear()}
							</span>
							<p className="dashboard__member-label">
								{memberHours[member.id] ?? "00:00"}
							</p>
						</div>
					</NavLink>
				))}
			</div>
			<StatusIndicator loading={loading} error={error} />
		</>
	);
};

export default Home;
