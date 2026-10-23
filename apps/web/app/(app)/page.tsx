import { redirect } from "next/navigation";

/** La racine ouvre « Ma boîte », point d'entrée de chaque utilisateur. */
export default function HomePage() {
  redirect("/inbox");
}
