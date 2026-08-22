import { supabase } from "../lib/supabase";

const TABLE = "bookings";

export const bookingsService = {
	getAll: () => supabase.from(TABLE).select("*"),

	create: (data: any) => supabase.from(TABLE).insert([data]),

	update: (id: string, data: any) =>
		supabase.from(TABLE).update(data).eq("id", id),

	delete: (id: string) => supabase.from(TABLE).delete().eq("id", id),
};
