import { NavLink } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useEffect, useState } from "react";
import BoxArrowLeftIcon from "../../icons/BoxArrowLeftIcon";
import { extractNameInitials } from "../../../utils/helpers";
import HouseIcon from "../../icons/HouseIcon";
import "./styles.scss";
import TeamIcon from "../../icons/TeamIcon";

const Sidebar = () => {
	const handleLogout = async () => {
		await supabase.auth.signOut();
	};

	const [data, setData] = useState<{ id: string; full_name: string }[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [currentUser, setCurrentUser] = useState<{
		id: string;
		full_name: string;
	} | null>(null);

	useEffect(() => {
		const fetchMembers = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const { data: members, error } = await supabase
				.from("members")
				.select("id, full_name");

			if (error) setError(error.message);
			if (user) {
				setCurrentUser(members?.find((m) => m.id === user.id) ?? null);
				setData(members?.filter((m) => m.id !== user.id) ?? []);
			} else {
				setData(members ?? []);
			}
		};

		fetchMembers();
	}, []);

	console.log(error);

	return (
		<aside className="sidebar">
			<NavLink className="sidebar__logo" style={{ fontSize: "1.5rem" }} to="/">
				<img src="/logo.svg" width={24} alt="" />
				<span>Workshift</span>
			</NavLink>
			<nav className="sidebar-nav">
				<NavLink
					className={({ isActive }) =>
						`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
					}
					to={"/"}
				>
					<span>
						<HouseIcon />
					</span>
					<span>Dashboard</span>
				</NavLink>
				<div className="sidebar-container">
					<p>Members</p>
					<div className="sidebar-dd">
						{data?.map((member) => {
							return (
								<NavLink
									key={member.id}
									className={({ isActive }) =>
										`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
									}
									to={`/users/${member.id}`}
								>
									<span className="sidebar__avatar">
										{member.full_name
											? extractNameInitials(member.full_name)
											: ""}
									</span>
									<span>{member.full_name}</span>
								</NavLink>
							);
						})}
					</div>
				</div>
				<NavLink
					className={({ isActive }) =>
						`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
					}
					to={"/clients"}
				>
					<span>
						<TeamIcon />
					</span>
					<span>Clients</span>
				</NavLink>
			</nav>
			<div className="sidebar__current-user" style={{ marginTop: "auto" }}>
				<NavLink
					className={({ isActive }) =>
						`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
					}
					to={`/users/${currentUser?.id}`}
				>
					<span className="sidebar__avatar">
						{currentUser?.full_name
							? extractNameInitials(currentUser.full_name)
							: ""}
					</span>
					<span>{currentUser?.full_name}</span>
				</NavLink>
				<button className="logout-btn" onClick={handleLogout}>
					<BoxArrowLeftIcon size={20} />
				</button>
			</div>
		</aside>
	);
};

export default Sidebar;
