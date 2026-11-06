-- Rôle par équipe pour le staff : un même membre peut être entraîneur
-- dans une équipe et coach dans une autre, donc le rôle ne peut plus
-- être déduit uniquement de members.roles. Les lignes existantes
-- reprennent "coach" si le membre n'a que ce rôle globalement, sinon
-- "entraineur" par défaut.

alter table team_staff add column if not exists role text not null default 'entraineur'
  check (role in ('entraineur', 'coach'));

update team_staff ts
set role = 'coach'
from members m
where m.id = ts.member_id
  and 'coach' = any(m.roles)
  and not ('entraineur' = any(m.roles));
