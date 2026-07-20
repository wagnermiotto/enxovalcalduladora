import { redirect } from "next/navigation";

// A raiz do site é a área do CLIENTE: quem chega pelo domínio vê o pedido de
// orçamento, não o painel. A equipe entra por /painel.
export default function Home() {
  redirect("/orcamento");
}
