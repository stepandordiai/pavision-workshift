import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./styles.scss";

const ResetPassword = () => {
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	// const [success, setSuccess] = useState("");
	const navigate = useNavigate();

	const handleReset = async () => {
		setLoading(true);
		setError("");

		try {
			const { error } = await supabase.auth.updateUser({
				password,
			});

			if (error) throw error;
			// setSuccess("Password successfully changed!");
			await supabase.auth.signOut();
			navigate("/login", { replace: true });
		} catch (error) {
			setError(
				error instanceof Error ? error.message : "Помилка відновлення пароля",
			);
		} finally {
			setLoading(false);
			// setTimeout(() => setSuccess(""), 3000);
		}
	};

	return (
		<main className="reset-password">
			<div className="login__logo">
				<img src="/logo.svg" width={100} alt="" />
				<h1 style={{ fontSize: "2rem" }}>Workshift</h1>
			</div>
			<form className="reset-password__form">
				<h1 className="reset-password__form-heading">Reset password</h1>
				{error && <p>{error}</p>}
				<div className="reset-password-input-container">
					<label
						className="reset-password__label"
						htmlFor="reset-password-password"
					>
						New password
					</label>
					<input
						id="reset-password-password"
						className="reset-password__input"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<button className="reset-password__btn" onClick={handleReset}>
					{loading ? "Updating password..." : "Update password"}
				</button>
			</form>
			<p className="login__author">
				Created by{" "}
				<a
					className="underline-effect"
					href="https://www.heeeyooo.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span>heeeyooo studio</span>
				</a>
			</p>
		</main>
	);
};

export default ResetPassword;
