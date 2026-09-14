export const validFullName = (fullName: string) => {
	return fullName.trim().split(/\s+/).length === 2;
};

export const validEmail = (email: string) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const validTel = (tel: string) => {
	return /^[0-9+\-()\s]{9,}$/.test(tel.trim());
};
