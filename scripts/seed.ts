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

const demoExercises = [
  {
    titre: "Échauffement articulaire",
    partie: "echauffement",
    dureeDefautMinutes: 8,
    consignes: "Rotation chevilles, genoux, hanches, épaules. Sans ballon.",
    tags: ["demo", "sans-ballon"],
  },
  {
    titre: "Passes à deux mains",
    partie: "fondamentaux",
    dureeDefautMinutes: 10,
    consignes: "Binômes face à face, passes poitrine puis à terre. Augmenter la distance progressivement.",
    tags: ["demo", "passe"],
  },
  {
    titre: "1 contre 1 fermeture",
    partie: "theme",
    dureeDefautMinutes: 15,
    consignes: "Le défenseur part en retard d'un pas, doit refermer avant le panier.",
    tags: ["demo", "defense", "1c1"],
  },
  {
    titre: "Match 3 contre 3",
    partie: "jeu",
    dureeDefautMinutes: 12,
    consignes: "Demi-terrain, un seul panier, change de possession sur interception.",
    tags: ["demo", "match"],
  },
  {
    titre: "Étirements",
    partie: "retour_calme",
    dureeDefautMinutes: 5,
    consignes: "Étirements statiques, respiration calme.",
    tags: ["demo"],
  },
];

async function main() {
  console.log("Nettoyage des anciennes données de démo…");
  const { error: deleteExercisesError } = await supabase
    .from("exercises")
    .delete()
    .contains("tags", ["demo"]);
  if (deleteExercisesError) throw deleteExercisesError;

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

  console.log("Création des fiches joueur de démo…");
  const { error: profilesError } = await supabase.from("player_profiles").insert([
    {
      member_id: byName("Léo"),
      date_naissance: "2011-03-14",
      poste: "Meneur",
      contact_nom: "Marc (père)",
      contact_telephone: "06 00 00 00 01",
      contact_email: "marc.demo@example.com",
    },
    {
      member_id: byName("Nina"),
      date_naissance: "2011-07-22",
      poste: "Ailière",
      contact_nom: "Sandrine (mère)",
      contact_telephone: "06 00 00 00 02",
      contact_email: "sandrine.demo@example.com",
    },
  ]);
  if (profilesError) throw profilesError;

  console.log("Création d'un questionnaire bien-être de démo…");
  const { error: wellbeingError } = await supabase.from("wellbeing_entries").insert({
    member_id: byName("Nina"),
    date: new Date().toISOString().slice(0, 10),
    sommeil: 4,
    forme: 3,
    courbatures: 2,
    moral: 5,
    commentaire: "Petite douleur au genou droit après l'entrainement d'hier.",
  });
  if (wellbeingError) throw wellbeingError;

  console.log("Création d'une note de suivi de démo…");
  const { error: noteError } = await supabase.from("player_notes").insert({
    member_id: byName("Léo"),
    author_id: byName("Sophie"),
    contenu: "Bons progrès sur les passes à deux mains. À travailler : la main faible en dribble.",
  });
  if (noteError) throw noteError;

  console.log("\nMembres de démo créés :\n");
  console.table(
    demoMembers.map((m) => ({
      nom: `${m.prenom} ${m.nom}`,
      roles: m.roles.join(", "),
      code: m.codeLength === 6 ? DEMO_CODE_6 : DEMO_CODE_4,
    }))
  );
  console.log(`\nÉquipe de démo : ${DEMO_TEAM_NOM} (mardi 18h-19h30, vendredi 18h30-20h)`);

  console.log("Création des exercices de démo…");
  const { data: insertedExercises, error: exercisesError } = await supabase
    .from("exercises")
    .insert(
      demoExercises.map((ex) => ({
        titre: ex.titre,
        partie: ex.partie,
        duree_defaut_minutes: ex.dureeDefautMinutes,
        consignes: ex.consignes,
        tags: ex.tags,
      }))
    )
    .select("id, titre");
  if (exercisesError) throw exercisesError;
  console.log(`${demoExercises.length} exercices créés dans la bibliothèque.`);

  const exerciceIdByTitre = (titre: string) => insertedExercises!.find((e) => e.titre === titre)!.id;

  console.log("Création d'un cycle de démo…");
  const cycleStart = new Date();
  const cycleEnd = new Date();
  cycleEnd.setDate(cycleEnd.getDate() + 27);
  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .insert({
      team_id: team.id,
      nom: "Prise de repères",
      date_debut: cycleStart.toISOString().slice(0, 10),
      date_fin: cycleEnd.toISOString().slice(0, 10),
      objectif: "Poser les bases collectives avant les premiers matchs.",
    })
    .select("id")
    .single();
  if (cycleError) throw cycleError;

  console.log("Création d'une séance de démo…");
  const nextTuesday = new Date();
  nextTuesday.setDate(nextTuesday.getDate() + ((2 - nextTuesday.getDay() + 7) % 7 || 7));
  const seanceDate = nextTuesday.toISOString().slice(0, 10);

  const { data: seance, error: seanceError } = await supabase
    .from("seances")
    .insert({
      team_id: team.id,
      date: seanceDate,
      heure_debut: "18:00",
      heure_fin: "19:30",
      titre: "Défense sur porteur de balle",
      cycle_id: cycle.id,
    })
    .select("id")
    .single();
  if (seanceError) throw seanceError;

  const blocsPlan = [
    { titre: "Échauffement articulaire", duree: 8 },
    { titre: "Passes à deux mains", duree: 10 },
    { titre: "1 contre 1 fermeture", duree: 15 },
    { titre: "Match 3 contre 3", duree: 12 },
    { titre: "Étirements", duree: 5 },
  ];
  const { error: blocsError } = await supabase.from("seance_blocs").insert(
    blocsPlan.map((b, i) => ({
      seance_id: seance.id,
      exercice_id: exerciceIdByTitre(b.titre),
      ordre: i + 1,
      duree_minutes: b.duree,
    }))
  );
  if (blocsError) throw blocsError;
  console.log(`Séance de démo créée pour le ${seanceDate} (${blocsPlan.length} blocs).`);

  console.log("Création d'un match de démo avec missions bénévoles…");
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7));
  const matchDate = nextSaturday.toISOString().slice(0, 10);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      team_id: team.id,
      ffbb_numero: "DEMO-001",
      division: "Démo-T1",
      adversaire: "Adversaire Démo",
      domicile: true,
      date: matchDate,
      heure: "14:00",
      salle: "Salle des sports",
    })
    .select("id")
    .single();
  if (matchError) throw matchError;

  const { data: missions, error: missionsError } = await supabase
    .from("match_missions")
    .insert([
      { match_id: match.id, titre: "Table de marque", besoin: 1 },
      { match_id: match.id, titre: "Buvette", besoin: 2 },
    ])
    .select("id, titre");
  if (missionsError) throw missionsError;

  const buvette = missions!.find((m) => m.titre === "Buvette")!;
  const { error: inscriptionError } = await supabase
    .from("match_mission_inscriptions")
    .insert({ mission_id: buvette.id, member_id: byName("Julie") });
  if (inscriptionError) throw inscriptionError;

  console.log(`Match de démo créé pour le ${matchDate} avec 2 missions bénévoles.`);

  console.log("Création d'un match passé de démo avec historique bénévole…");
  const lastSaturday = new Date();
  lastSaturday.setDate(lastSaturday.getDate() - ((lastSaturday.getDay() + 1) % 7 || 7));
  const pastMatchDate = lastSaturday.toISOString().slice(0, 10);

  const { data: pastMatch, error: pastMatchError } = await supabase
    .from("matches")
    .insert({
      team_id: team.id,
      ffbb_numero: "DEMO-000",
      division: "Démo-T1",
      adversaire: "Ancien Adversaire Démo",
      domicile: true,
      date: pastMatchDate,
      heure: "14:00",
      salle: "Salle des sports",
      score_bvb: 52,
      score_adversaire: 48,
    })
    .select("id")
    .single();
  if (pastMatchError) throw pastMatchError;

  const { data: pastMission, error: pastMissionError } = await supabase
    .from("match_missions")
    .insert({ match_id: pastMatch.id, titre: "Buvette", besoin: 2 })
    .select("id")
    .single();
  if (pastMissionError) throw pastMissionError;

  const { error: pastInscriptionError } = await supabase
    .from("match_mission_inscriptions")
    .insert({ mission_id: pastMission.id, member_id: byName("Julie") });
  if (pastInscriptionError) throw pastInscriptionError;

  console.log("Création d'un profil bénévole de démo…");
  const { error: benevoleProfileError } = await supabase.from("benevole_profiles").insert({
    member_id: byName("Julie"),
    contact_telephone: "06 00 00 00 03",
    contact_email: "julie.demo@example.com",
    disponibilites: "Disponible les week-ends, pas le vendredi soir.",
  });
  if (benevoleProfileError) throw benevoleProfileError;

  console.log("\nConnexion : cherchez le nom sur /connexion, puis entrez le code ci-dessus.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
