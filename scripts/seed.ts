import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

const DEMO_CODE_6 = "123456";
const DEMO_CODE_4 = "1234";

const demoMembers = [
  { prenom: "Admin", nom: "Démo", roles: ["admin"], codeLength: 6 as const },
  {
    prenom: "Sophie",
    nom: "Entraineur-Démo",
    roles: ["entraineur"],
    codeLength: 6 as const,
  },
  {
    prenom: "Thomas",
    nom: "Multi-Démo",
    roles: ["entraineur", "coach"],
    codeLength: 6 as const,
  },
  { prenom: "Karim", nom: "Coach-Démo", roles: ["coach"], codeLength: 4 as const },
  { prenom: "Léo", nom: "Joueur-Démo", roles: ["joueur"], codeLength: 4 as const },
  {
    prenom: "Julie",
    nom: "Benevole-Démo",
    roles: ["benevole"],
    codeLength: 4 as const,
  },
];

async function main() {
  console.log("Nettoyage des anciennes données de démo…");
  const { error: deleteError } = await supabase
    .from("members")
    .delete()
    .like("nom", "%Démo%");
  if (deleteError) throw deleteError;

  console.log("Création des membres de démo…\n");
  const rows = [];
  for (const m of demoMembers) {
    const code = m.codeLength === 6 ? DEMO_CODE_6 : DEMO_CODE_4;
    const codeHash = await bcrypt.hash(code, 10);
    rows.push({
      prenom: m.prenom,
      nom: m.nom,
      roles: m.roles,
      code_hash: codeHash,
      code_length: m.codeLength,
      must_change_code: true,
    });
  }

  const { error: insertError } = await supabase.from("members").insert(rows);
  if (insertError) throw insertError;

  console.log("Membres de démo créés :\n");
  console.table(
    demoMembers.map((m) => ({
      nom: `${m.prenom} ${m.nom}`,
      roles: m.roles.join(", "),
      code: m.codeLength === 6 ? DEMO_CODE_6 : DEMO_CODE_4,
    }))
  );
  console.log(
    "\nConnexion : cherchez le nom sur /connexion, puis entrez le code ci-dessus."
  );
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
