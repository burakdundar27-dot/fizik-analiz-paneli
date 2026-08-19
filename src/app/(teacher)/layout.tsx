import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppHeader } from "@/components/shared/app-header";
import { HOME_BY_ROLE } from "@/lib/constants";

/** Rol kapısı: yalnız öğretmen. */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (user.role !== "teacher") redirect(HOME_BY_ROLE[user.role]);

  return (
    <div className="min-h-svh">
      <AppHeader fullName={user.full_name} role={user.role} />
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
