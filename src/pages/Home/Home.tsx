import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import timeToMinutes from "../../utils/timeToMinutes";
import { NavLink } from "react-router-dom";
import StatusIndicator from "../../components/StatusIndicator/StatusIndicator";
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

const formatDisplayDate = (dateStr: string) => {
	const [year, month, day] = dateStr.split("-");
	return `${day}.${month}.${year}`;
};

const Home = () => {
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<{ id: string; full_name: string }[]>([]);
	const [monthRange, setMonthRange] = useState<{
		from: string;
		to: string;
	} | null>(null);
	const [memberHours, setMemberHours] = useState<Record<string, string>>({});

	useEffect(() => {
		const fetchMembersAndHours = async () => {
			setLoading(true);
			setError(null);

			try {
				const now = new Date();
				const year = now.getFullYear();
				const month = now.getMonth(); // 0-indexed
				const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

				setMonthRange({ from, to });

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
	}, []);

	return (
		<>
			<section className="section">
				<h1 className="main__title">Dashboard</h1>
			</section>
			<div>
				<h2>Members</h2>
				<div>
					{monthRange && (
						<p className="dashboard__period">
							Total hours in period from {formatDisplayDate(monthRange.from)} to{" "}
							{formatDisplayDate(monthRange.to)}
						</p>
					)}
				</div>
				<div className="dashboard__members-grid">
					{data.map((member) => (
						<NavLink
							to={`/users/${member.id}`}
							key={member.id}
							className="dashboard__member-card"
						>
							<p>{member.full_name}</p>
							<div className="dashboard__member-total">
								<span>Total</span>
								<p className="dashboard__member-label">
									{memberHours[member.id] ?? "00:00"}
								</p>
							</div>
						</NavLink>
					))}
				</div>
			</div>
			<StatusIndicator loading={loading} error={error} />
		</>
	);
};

export default Home;
