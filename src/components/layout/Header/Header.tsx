import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import classNames from "classnames";
// import TeamIcon from "../../icons/TeamIcon";
import { extractNameInitials } from "../../../utils/helpers";
import { supabase } from "../../../lib/supabase";
import BoxArrowLeftIcon from "../../icons/BoxArrowLeftIcon";
import "./Header.scss";
import HouseIcon from "../../icons/HouseIcon";
import TeamIcon from "../../icons/TeamIcon";

const Header = ({}) => {
	const [menuVisible, setMenuVisible] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);

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

	const handleMenu = () => setMenuVisible((prev) => !prev);

	return (
		<>
			<div
				className={classNames("header-modal", {
					"header-modal--visible": modalOpen,
				})}
			>
				<p style={{ fontWeight: 600 }}>Opravdu se chcete odhlásit?</p>
				<button
					style={{ background: "var(--red-clr)" }}
					className="header-modal__btn"
					onClick={handleLogout}
				>
					Odhlásit se
				</button>
				<button
					style={{ background: "#000" }}
					className="header-modal__btn"
					onClick={() => setModalOpen(false)}
				>
					Zrušit
				</button>
			</div>
			<div
				onClick={() => setModalOpen(false)}
				className={classNames("header__curtain", {
					"header__curtain--visible": modalOpen,
				})}
			></div>
			<header className="header">
				<NavLink
					onClick={() => setMenuVisible(false)}
					className="header__logo"
					to="/"
				>
					<img src="/logo.svg" width={24} alt="" />
					<span>Workshift</span>
				</NavLink>
				{/* <div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: 5,
					}}
				>
					{currentUser ? (
						<button onClick={() => setModalOpen(true)} className="header__btn">
							Odhlásit se
						</button>
					) : (
						<div style={{ display: "flex", gap: 10 }}>
							<NavLink
								onClick={() => setMenuVisible(false)}
								className="header__link"
								to="/register"
							>
								Registrace
							</NavLink>
							<NavLink
								onClick={() => setMenuVisible(false)}
								className="header__link"
								to="/login"
							>
								Prihlasit se
							</NavLink>
						</div>
					)} */}
				<button onClick={handleMenu} className="menu-btn">
					{menuVisible ? "Close" : "Menu"}
				</button>
				{/* </div> */}
			</header>

			{/* menu */}

			<div
				className={classNames("menu", {
					"menu--visible": menuVisible,
				})}
			>
				<NavLink
					onClick={() => setMenuVisible(false)}
					className={({ isActive }) =>
						`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
					}
					to="/"
				>
					<span>
						<HouseIcon />
					</span>
					<span>Dashboard</span>
				</NavLink>
				<div className="menu-inner">
					{!currentUser ? null : (
						<>
							<div className="sidebar-wrapper">
								<div className="sidebar__title-btn">
									{/* <TeamIcon size={20} /> */}
									<h2>Members</h2>
								</div>
								<div className="sidebar-wrapper-inner sidebar-wrapper-inner--visible">
									<div className="sidebar-container">
										{data.map((member) => {
											return (
												<NavLink
													onClick={() => setMenuVisible(false)}
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
							</div>
						</>
					)}
				</div>
				<NavLink
					onClick={() => setMenuVisible(false)}
					className={({ isActive }) =>
						`sidebar__nav-link ${isActive ? "sidebar__nav-link--selected" : ""}`
					}
					to="/clients"
				>
					<span>
						<TeamIcon />
					</span>
					<span>Clients</span>
				</NavLink>
				<div className="sidebar__current-user" style={{ marginTop: "auto" }}>
					<NavLink
						onClick={() => setMenuVisible(false)}
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
			</div>
		</>
	);
};

export default Header;
