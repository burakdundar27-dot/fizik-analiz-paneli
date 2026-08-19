import { Atom, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { signOut } from "@/app/(auth)/actions";

export function AppHeader({ fullName, role }: { fullName: string; role: UserRole }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          <Atom className="size-5 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Fizik Analiz Paneli</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{fullName}</p>
            <p className="text-xs text-muted-foreground">{USER_ROLES[role]}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Çıkış yap">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
