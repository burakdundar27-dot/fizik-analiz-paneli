import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { HOME_BY_ROLE } from "@/lib/constants";

/** Tek iş: rolü oku, doğru panele yönlendir. */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  redirect(HOME_BY_ROLE[user.role]);
}
