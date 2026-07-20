import { redirect } from "next/navigation";

// Por enquanto o sistema é só o painel interno — como no PHP, a raiz manda
// para dentro. Quando existir uma vitrine pública, ela entra aqui.
export default function Home() {
  redirect("/painel");
}
