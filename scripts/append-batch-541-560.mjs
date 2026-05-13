import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  `541,likviditet,sb,betalningsförmåga,omsättningshastighet,kreditvärdighet,kapitalbas,räntabilitet,Företagets förmåga att betala sina löpande utgifter i tid.,Bolagets likviditet försvagades när stora kunder dröjde med betalningarna.,ekonomi,2,curated,"solvens,kassalikviditet",Latinskt lånord`,
  `542,konjunktur,sb,ekonomiskt läge,ekonomisk reform,politisk stabilitet,marknadens utveckling,finansiell prognos,Det allmänna ekonomiska tillståndet i samhället under en viss period.,Konjunkturen vände uppåt efter två år av minskande sysselsättning.,ekonomi,2,curated,"marknadsläge,ekonomiskt tillstånd",Latinskt lånord`,
  `543,borgenär,sb,fordringsägare,gäldenär,delägare,mäklare,revisor,Person eller företag som har en utestående fordran mot någon annan.,Borgenärerna krävde att skulden skulle betalas innan bolaget gick i konkurs.,ekonomi,2,curated,"kreditgivare,långivare,fordringshavare",`,
  `544,emission,sb,utgivande,omplacering,börsnotering,omfördelning,ägarbyte,Utgivande av nya aktier eller obligationer från ett företag eller stat.,Banken meddelade en stor emission av nya aktier för att stärka kapitalet.,ekonomi,2,curated,"utgivning,nyemission",`,
  `545,gäldenär,sb,låntagare,borgenär,garant,klient,lånförmedlare,Den som är skyldig någon pengar eller annan prestation.,Gäldenären lyckades reglera sin skuld innan ärendet gick till kronofogden.,ekonomi,3,curated,"debitor,skuldsatt person",Juridisk-ekonomisk term`,
  `546,arvode,sb,ersättning,bonus,dricks,premie,traktamente,Bestämd betalning för utfört uppdrag eller arbete.,Advokaten begärde ett högre arvode för det komplicerade ärendet.,ekonomi,1,curated,"honorar,gage,kompensation",`,
  `547,avskrivning,sb,värdeminskning,kostnadsföring,vinstdelning,omräkning,justering,Bokföringsmässig minskning av en tillgångs värde över tid.,Företaget gjorde en avskrivning på maskinparken efter tio års användning.,ekonomi,1,curated,"depreciering,nedskrivning",`,
  `548,omsättning,sb,försäljningsvolym,vinst,kassaflöde,balansomslutning,kapitalstock,Det sammanlagda värdet av ett företags försäljning under en period.,Butikens omsättning ökade kraftigt under julhandeln tack vare gott vintervädret.,ekonomi,1,curated,"försäljning,intäkter",`,
  `549,intäkt,sb,inkomst,utgift,vinst,avgift,saldo,Pengar som strömmar in till en verksamhet under en viss period.,Föreningens intäkter från medlemsavgifter räckte knappt för att täcka driftskostnaderna.,ekonomi,1,curated,"inflöde,inbetalning",`,
  `550,tariff,sb,avgiftslista,priskontroll,tullkvot,valutasats,gebyr,Officiell avgift eller pris för en tjänst eller import.,Elbolagets nya tariff höjde månadskostnaden för alla hushåll i regionen.,ekonomi,2,curated,"taxa,avgiftstabell,prislista",Franskt lånord`,
  `551,solvent,adj,betalningsförmögen,kapitalstark,insolvent,vinstgivande,bemedlad,Förmögen att fullgöra sina ekonomiska förpliktelser.,Trots krisen var företaget fortfarande solvent och kunde betala löner.,ekonomi,2,curated,"kreditvärdig,betalningsstark",Latinskt lånord`,
  `552,lukrativ,adj,lönsam,kostsam,riskfylld,gynnsam,praktisk,Som ger god ekonomisk avkastning eller hög vinst.,Den lukrativa marknaden lockade allt fler nya aktörer varje år.,ekonomi,2,curated,"vinstgivande,inkomstbringande,profitabel",Latinskt lånord`,
  `553,insolvent,adj,betalningsoförmögen,skuldfri,egendomslös,olönsam,kostnadskrävande,Oförmögen att betala sina skulder när de förfaller.,Bolaget förklarades insolvent och försattes i konkurs efter långa förhandlingar.,ekonomi,2,curated,"bankrutt,konkursmässig",Latinskt lånord`,
  `554,stagnerande,adj,stillastående,blomstrande,turbulent,vacklande,fluktuerande,Som har stannat av eller saknar tillväxt och utveckling.,Den stagnerande ekonomin oroade både regeringen och näringslivet alltmer.,ekonomi,2,curated,"avstannande,oföränderlig",`,
  `555,expansiv,adj,snabbt växande,långsamt krympande,ekonomiskt stabil,kortsiktigt planerad,försiktigt skött,Som strävar efter att växa eller utvidga sin verksamhet.,Företaget förde en expansiv strategi och öppnade kontor i flera länder.,ekonomi,1,curated,"tillväxtinriktad,utvidgande",`,
  `556,avyttra,vb,sälja av,skänka bort,skriva av,dela ut,köpa upp,Att sälja eller göra sig av med en tillgång.,Företaget avyttrade dotterbolaget i Norge för att fokusera på kärnverksamheten.,ekonomi,2,curated,"överlåta,realisera",`,
  `557,kalkylera,vb,räkna ut,gissa fram,pruta ner,planera in,dra slutsats,"Att noggrant beräkna kostnader, intäkter eller andra ekonomiska värden.",Innan avtalet skrevs kalkylerade ekonomichefen alla potentiella kostnader och risker.,ekonomi,2,curated,"beräkna,kostnadsberäkna",Latinskt lånord`,
  `558,expandera,vb,utvidga,krympa,bibehålla,stagnera,omforma,"Att växa i storlek, omfång eller verksamhet.",Företaget expanderade till tre nya marknader under det första året.,ekonomi,1,curated,"utöka,växa,utvecklas",`,
  `559,depreciera,vb,minska i värde,stiga i värde,behålla sitt värde,växa i kurs,öka i avkastning,Att gradvis minska i värde eller köpkraft över tid.,Kronan deprecierade mot dollarn under hela året och importen blev dyrare.,ekonomi,3,curated,"tappa värde,skrivas ned",Latinskt lånord`,
  `560,per capita,annat,per person,per hushåll,per arbetsdag,per kvartal,per uppdrag,Räknat per invånare eller individ i en grupp.,Sveriges BNP per capita ligger högt jämfört med många andra länder.,ekonomi,3,curated,"per individ,per invånare",Latinskt uttryck`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const endsWithNewline = before.endsWith("\n");
const sep = endsWithNewline ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
