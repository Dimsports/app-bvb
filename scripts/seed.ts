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
const DEMO_TEAM_NOM = "U15 Filles (Démo)";

const demoMembers = [
  { prenom: "Admin", nom: "Démo", roles: ["admin"], codeLength: 6 as const },
  { prenom: "Sophie", nom: "Entraineur-Démo", roles: ["entraineur"], codeLength: 6 as const },
  { prenom: "Thomas", nom: "Multi-Démo", roles: ["entraineur", "coach"], codeLength: 6 as const },
  { prenom: "Karim", nom: "Coach-Démo", roles: ["coach"], codeLength: 4 as const },
  { prenom: "Julie", nom: "Benevole-Démo", roles: ["benevole"], codeLength: 4 as const },
  { prenom: "Léo", nom: "Joueur-Démo", roles: ["joueur"], codeLength: 4 as const },
  { prenom: "Nina", nom: "Joueuse-Démo", roles: ["joueur"], codeLength: 4 as const },
  { prenom: "Enzo", nom: "Joueur2-Démo", roles: ["joueur"], codeLength: 4 as const },
  { prenom: "Camille", nom: "Joueuse2-Démo", roles: ["joueur"], codeLength: 4 as const },
  { prenom: "Inès", nom: "Joueuse3-Démo", roles: ["joueur"], codeLength: 4 as const },
];

async function main() {
  console.log("Nettoyage des anciennes données de démo…");
  const { error: deleteTeamsError } = await supabase
    .from("teams")
    .delete()
    .ilike("nom", "%Démo%");
  if (deleteTeamsError) throw deleteTeamsError;

  const { error: deleteError } = await supabase.from("members").delete().like("nom", "%Démo%");
  if (deleteError) throw deleteError;

  console.log("Création des membres de démo…");
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

  const { data: inserted, error: insertError } = await supabase
    .from("members")
    .insert(rows)
    .select("id, prenom, nom, roles");
  if (insertError) throw insertError;

  const byName = (prenom: string) => inserted!.find((m) => m.prenom === prenom)!.id;

  console.log("Création de l'équipe de démo…");
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ categorie: "U15", genre: "F", nom: DEMO_TEAM_NOM, gymnase: "Salle des sports" })
    .select("id")
    .single();
  if (teamError) throw teamError;

  const { error: creneauxError } = await supabase.from("team_creneaux").insert([
    { team_id: team.id, jour: 2, heure_debut: "18:00", heure_fin: "19:30" },
    { team_id: team.id, jour: 5, heure_debut: "18:30", heure_fin: "20:00" },
  ]);
  if (creneauxError) throw creneauxError;

  const { error: staffError } = await supabase.from("team_staff").insert([
    { team_id: team.id, member_id: byName("Sophie") },
    { team_id: team.id, member_id: byName("Thomas") },
  ]);
  if (staffError) throw staffError;

  const joueurPrenoms = ["Léo", "Nina", "Enzo", "Camille", "Inès"];
  const { error: rosterError } = await supabase
    .from("team_roster")
    .insert(joueurPrenoms.map((p) => ({ team_id: team.id, member_id: byName(p) })));
  if (rosterError) throw rosterError;

  console.log("\nMembres de démo créés :\n");
  console.table(
    demoMembers.map((m) => ({
      nom: `${m.prenom} ${m.nom}`,
      roles: m.roles.join(", "),
      code: m.codeLength === 6 ? DEMO_CODE_6 : DEMO_CODE_4,
    }))
  );
  console.log(`\nÉquipe de démo : ${DEMO_TEAM_NOM} (mardi 18h-19h30, vendredi 18h30-20h)`);
  console.log("Connexion : cherchez le nom sur /connexion, puis entrez le code ci-dessus.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
