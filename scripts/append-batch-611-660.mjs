import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  // --- substantiv, diff 1 (6) ---
  `611,åtal,sb,rättslig anklagelse,kriminellt brott,formell varning,juridisk dom,civil stämning,Formell anklagelse i domstol om brott.,Åklagaren väckte åtal mot mannen för grov misshandel.,juridik,1,curated,"anklagelse,åtalsstämning",`,
  `612,rättegång,sb,juridisk förhandling,polisens utredning,advokatens samtal,åtalets uppläsning,brottets utredning,Process där domstol prövar och avgör ett mål.,Rättegången pågick i flera veckor innan domen kunde meddelas.,juridik,1,curated,"domstolsförhandling,prövning,process",`,
  `613,åklagare,sb,anklagare,domare,advokat,vittne,nämndeman,Tjänsteman som väcker åtal och företräder staten i brottmål.,Åklagaren presenterade bevisen mot den misstänkte under förhandlingen.,juridik,1,curated,"prosekuter,statens företrädare",`,
  `614,svarande,sb,anklagad,kärande,målsägande,vittne,advokat,Den part i ett mål mot vilken talan har väckts.,Svaranden förnekade alla anklagelser under den långa förhandlingen.,juridik,1,curated,"tilltalad,försvarspart",`,
  `615,testamente,sb,arvshandling,gåvobrev,äktenskapsförord,kontrakt,fullmakt,Skriftlig handling där någon förordnar om sin egendom efter döden.,Hennes testamente upprättades hos en notarie för några år sedan.,juridik,1,curated,"yttersta vilja,arvförordnande",Latinskt lånord`,
  `616,skadestånd,sb,ersättning,böter,fängelse,varning,åtal,Penningersättning för skada som en person orsakat någon annan.,Företaget tvingades betala stort skadestånd för miljöbrottet i fjorden.,juridik,1,curated,"gottgörelse,kompensation,ersättningsbelopp",`,
  // --- substantiv, diff 2 (14) ---
  `617,häktning,sb,tillfälligt frihetsberövande,permanent fängelsestraff,övervakad frigivning,formell anklagelse,polisiär granskning,Beslut om att en misstänkt ska sitta inlåst inför rättegång.,Tingsrätten beslutade om häktning på grund av risk för flykt.,juridik,2,curated,"frihetsberövande,arrest",`,
  `618,mened,sb,falsk ed,hemlig vittnesutsaga,dolt brott,motbjudande löfte,oavsiktligt misstag,Avsiktligt osann utsaga som avges under ed i domstol.,Han åtalades för mened efter att ha avgivit falskt vittnesmål.,juridik,2,curated,"edsbrott,falsk utsaga",`,
  `619,preskription,sb,tidsbegränsning på krav,ogiltigförklaring av avtal,fastställande av påföljd,upplösning av avtal,anstånd med betalning,Att en rättslig fordran eller talan upphör efter viss tid.,Brottet hade preskription efter tio år och kunde inte längre åtalas.,juridik,2,curated,"preskriptionstid,upphörande av krav",Latinskt lånord`,
  `620,prejudikat,sb,vägledande dom,tidigare anklagelse,principiell stadga,formell föreskrift,fortlöpande regel,Tidigare domstolsavgörande som styr framtida liknande mål.,Högsta domstolens prejudikat påverkar hur underrätter dömer i liknande fall.,juridik,2,curated,"rättslig precedens,vägledande beslut",Latinskt lånord`,
  `621,nämndeman,sb,lekmannadomare,åklagare,notarie,juristdomare,vittne,Lekman som tillsammans med juristdomare avgör mål i tingsrätt.,Nämndemannen lyssnade noga på alla vittnesmål innan han röstade.,juridik,2,curated,"lekman i domstol,domstolslekman",`,
  `622,bevisbörda,sb,bevisskyldighet,vittnesplikt,åtalsskyldighet,försvarsplikt,undersökningsansvar,Skyldigheten att styrka sin sak med tillräcklig bevisning.,Åklagaren har bevisbörda för att den tilltalade verkligen är skyldig.,juridik,2,curated,"bevisansvar,styrkebörda",`,
  `623,vräkning,sb,avhysning,uppsägning,beslag,deportation,utestängning,Tvångsmässig flytt av hyresgäst från en bostad eller lokal.,Familjen drabbades av vräkning efter att ha släpat efter med hyran.,juridik,2,curated,"tvångsavhysning,bortvisning",`,
  `624,klausul,sb,avtalsvillkor,stadga,paragraf,åläggande,regelverk,Särskild bestämmelse eller villkor i ett avtal eller en lag.,Anställningsavtalet innehöll en klausul om sekretess gentemot företagets konkurrenter och kunder.,juridik,2,curated,"bestämmelse,villkor,paragraf",Latinskt lånord`,
  `625,borgen,sb,garanti,pant,försäkring,ansvarsförbindelse,fullmakt,Åtagande att betala någon annans skuld om denne brister.,Föräldrarna gick i borgen för sonens första lägenhetslån i staden.,juridik,2,curated,"kaution,garantiåtagande",`,
  `626,straffvärde,sb,brottsallvar,bötesnivå,skuldgrad,förmildring,åtalsbarhet,Det mått på allvar som tillmäts ett brott vid straffmätning.,Domaren bedömde straffvärdet och fastställde fängelsestraff i fyra år.,juridik,2,curated,"gärningsallvar,straffmätning",`,
  `627,dispens,sb,undantag,licens,godkännande,beslut,prövning,Beviljat undantag från en regel eller bestämmelse.,Studenten fick dispens från behörighetskravet på grund av särskilda skäl.,juridik,2,curated,"befrielse,särskilt tillstånd,avsteg",Latinskt lånord`,
  `628,ogiltigförklaring,sb,upphävande,tillbakadragande,uppskjutande,avslag,utdömande,Beslut om att en handling eller ett avtal inte längre gäller.,Hovrätten beslutade om ogiltigförklaring av det första kontraktet.,juridik,2,curated,"nullifiering,upphörande",`,
  `629,åtalspunkt,sb,anklagelse,rättssats,domstolsbeslut,vittnesmål,försvarstal,Enskild punkt i ett åtal som beskriver ett specifikt brott.,Den första åtalspunkten gällde grovt skattebrott under fem år.,juridik,2,curated,"åtalsmoment,brottspunkt",`,
  `630,förlikning,sb,frivillig uppgörelse,rättslig prövning,formell anklagelse,slutgiltig dom,kortvarig medling,Att parterna i en tvist kommer överens utan domstolsavgörande.,Parterna nådde förlikning innan rättegången ens hann inledas i hovrätten.,juridik,2,curated,"överenskommelse,godvillig uppgörelse,utomrättslig lösning",`,
  // --- substantiv, diff 3 (3) ---
  `631,proportionalitet,sb,balans,rättvisa,jämlikhet,regelbundenhet,riktighet,Rimligt förhållande mellan medel och mål i juridiskt beslut.,Domstolen prövade om åtgärden uppfyllde proportionalitet i förhållande till syftet.,juridik,3,curated,"rimlighetsbalans,proportion",Latinskt lånord`,
  `632,legat,sb,testamentsgåva,arvslott,fideikommiss,gåva,donation,Specifik egendom eller summa som tilldelas någon genom testamente.,Han fick ett betydande legat av sin bortgångne farbror i Norrland.,juridik,3,curated,"testamentariskt förordnande,arvsdel",Latinskt lånord`,
  `633,rekvisit,sb,brottsförutsättning,påföljd,domskäl,åtalsskäl,försvar,De omständigheter som krävs för att ett brott ska föreligga.,Alla rekvisit för bedrägeri var uppfyllda enligt åklagarens utredning.,juridik,3,curated,"brottselement,straffvärt villkor",Latinskt lånord`,
  // --- adjektiv, diff 1 (4) ---
  `634,straffbar,adj,lagstridig,tillåten,laglig,reglerad,berättigad,Som kan medföra rättslig påföljd enligt lag.,Att försumma att betala skatt är straffbart i Sverige.,juridik,1,curated,"olaglig,olovlig,lagvidrig",`,
  `635,lagstadgad,adj,föreskriven,föreslagen,frivillig,godkänd,traditionell,Som är fastställd eller krävs enligt en lag.,Arbetstagaren har rätt till lagstadgad semester varje år.,juridik,1,curated,"lagfäst,reglerad i lag,bestämd i lag",`,
  `636,oskyldig,adj,skuldfri,skyldig,åtalad,domförd,villkorad,Som inte är skyldig till ett brott eller en handling.,Den oskyldigt anklagade kämpade i åratal för att rentvå sitt namn.,juridik,1,curated,"oförvitlig,utan skuld",`,
  `637,obligatorisk,adj,tvingande,frivillig,valbar,rekommenderad,tillåten,Som måste utföras eller följas utan undantag.,Skolgång är obligatorisk för alla barn upp till nionde klass.,juridik,1,curated,"påbjuden,tvångsmässig,nödvändig",Latinskt lånord`,
  // --- adjektiv, diff 2 (7) ---
  `638,olaga,adj,olaglig,tillåten,berättigad,reglerad,formell,Som strider mot gällande lag eller bestämmelse.,Han åtalades för olaga hot mot grannarna i bostadsområdet.,juridik,2,curated,"lagstridig,otillåten,olovlig",Ålderdomligt register`,
  `639,jävig,adj,partisk,opartisk,neutral,engagerad,beslutsam,Som inte är opartisk i ett beslut eller en bedömning.,Domaren förklarade sig jävig och drog sig ur den känsliga rättegången.,juridik,2,curated,"inblandad,opålitlig,partsförhållande",`,
  `640,lagakraftvunnen,adj,slutgiltig,överklagad,tillfällig,oklar,preliminär,Som inte längre kan överklagas och därför gäller bindande.,Domen blev lagakraftvunnen efter att tiden för överklagande gått ut.,juridik,2,curated,"slutligt fastställd,bindande,oöverklagbar",`,
  `641,förmildrande,adj,mildrande,försvårande,allvarlig,berättigad,förvärrande,Som minskar allvaret eller skulden i en handling.,Domstolen tog hänsyn till förmildrande omständigheter vid straffmätningen.,juridik,2,curated,"lindrande,strafflindrande",`,
  `642,försvårande,adj,skärpande,förmildrande,berättigande,nedsättande,neutraliserande,Som ökar allvaret eller skulden i en handling.,Det fanns flera försvårande omständigheter som höjde straffvärdet betydligt.,juridik,2,curated,"straffskärpande,försämrande",`,
  `643,häktad,adj,frihetsberövad,friad,benådad,åtalad,dömd,Som sitter inlåst i avvaktan på rättegång eller dom.,Den misstänkte hölls häktad i tre månader innan domen meddelades.,juridik,2,curated,"fängslad,inspärrad,arresterad",`,
  `644,otillräknelig,adj,ansvarsbefriad,skyldig,ansvarstagande,medveten,straffbar,Som inte kan ställas straffrättsligt ansvarig för sina handlingar.,Den otillräknelige gärningsmannen dömdes till rättspsykiatrisk vård istället för fängelse.,juridik,2,curated,"ej tillräknelig,utan straffansvar",`,
  // --- adjektiv, diff 3 (2) ---
  `645,preceptiv,adj,som måste följas,som kan ändras,som är frivillig,som tillämpas valfritt,som beror på,Som är tvingande och inte kan avtalas bort av parterna.,Lagen om anställningsskydd är preceptiv till anställdas förmån.,juridik,3,curated,"tvingande,bindande,ovillkorlig",Latinskt lånord`,
  `646,diskretionär,adj,skönsmässig,tvingande,reglerad,automatisk,strikt,Som beror på beslutsfattarens eget omdöme snarare än fasta regler.,Myndighetens diskretionära beslut kunde inte överklagas till högre instans.,juridik,3,curated,"fri,beroende av omdöme",Franskt lånord`,
  // --- verb, diff 1 (3) ---
  `647,åtala,vb,väcka åtal,driva försvar,avge utlåtande,lägga ner,döma fri,Att formellt anklaga någon för brott inför domstol.,Åklagaren beslöt att åtala mannen för grovt rattfylleri.,juridik,1,curated,"stämma,anklaga",`,
  `648,häkta,vb,frihetsberöva,åtala,benåda,friförklara,avlyssna,Att låsa in en misstänkt i avvaktan på rättegång.,Polisen häktade tre personer i samband med den stora utredningen.,juridik,1,curated,"arrestera,fängsla,internera",`,
  `649,överklaga,vb,bestrida,godkänna,avstå,inställa,bekräfta,Att begära att en högre instans omprövar ett beslut.,Den dömde beslutade sig för att överklaga domen till hovrätten.,juridik,1,curated,"klaga på,överpröva,begära omprövning",`,
  // --- verb, diff 2 (6) ---
  `650,förlika,vb,medla,stämma,åtala,tvista,döma,Att få parter i en tvist att komma överens utan dom.,Advokaten lyckades förlika parterna innan tvisten nådde domstol.,juridik,2,curated,"förhandla,jämka,överenskomma",`,
  `651,vittna,vb,intyga,anklaga,försvara,neka,döma,Att avge utsaga i domstol om vad man sett eller hört.,Grannen vittnade om händelserna på gården kvällen då brottet begicks.,juridik,2,curated,"avge vittnesmål,bekräfta i rätten",`,
  `652,åberopa,vb,hänvisa till,bortse från,förkasta helt,gå emot,glömma bort,Att stödja sin sak på en regel eller omständighet.,Försvaret åberopade flera tidigare prejudikat under den långa förhandlingen.,juridik,2,curated,"påropa,åkalla",Juridiskt fackuttryck`,
  `653,pantsätta,vb,säkra,sälja,skänka,hyra,byta,Att ställa egendom som säkerhet för en skuld.,Han tvingades pantsätta huset för att betala företagets skulder.,juridik,2,curated,"lägga som pant,sätta i pant",`,
  `654,avkunna,vb,tillkännage formellt,överlämna skriftligt,motivera detaljerat,framställa allmänt,sammanfatta kortfattat,Att högtidligt meddela en dom eller ett beslut.,Domaren avkunnade domen efter en timmes överläggning i kammaren.,juridik,2,curated,"meddela,uttala,förkunna",Formellt register`,
  `655,lagföra,vb,åtala,försvara,benåda,frikänna,fängsla,Att rättsligt förfölja någon för ett påstått brott.,Brotten kunde inte lagföras eftersom preskriptionstiden hade löpt ut.,juridik,2,curated,"rättsligt åtala,beivra",`,
  // --- verb, diff 3 (1) ---
  `656,ådöma,vb,döma till,hänvisa till,befria från,undanta från,godkänna utan,Att i dom föreskriva en viss påföljd för någon.,Domstolen ådömde honom fängelse i två år för misshandeln.,juridik,3,curated,"utdöma,påföra,tillfoga som straff",Formellt register`,
  // --- adverb (3) ---
  `657,lagligen,adv,enligt lagen,bortom lagen,utan stöd,mot regler,via genväg,På ett sätt som överensstämmer med gällande lag.,Företaget hade hanterat skatten lagligen trots de aggressiva avdragen.,juridik,1,curated,"lovligt,lagligt,med lagens stöd",`,
  `658,olovligen,adv,utan tillstånd,med medgivande,efter ansökan,med tillstånd,under uppsikt,På ett sätt som strider mot lag eller tillåtelse.,Han hade olovligen tillträtt egendomen och bodde där hela vintern.,juridik,2,curated,"utan rätt,olagligt,obehörigt",`,
  `659,lagenligt,adv,lagligt,olagligt,egenmäktigt,godtyckligt,obegränsat,I full överensstämmelse med vad lagen föreskriver.,Allt hade gått till lagenligt under bouppteckningen efter farmorn.,juridik,2,curated,"i enlighet med lag,enligt regler,formellt korrekt",`,
  // --- annat (1) ---
  `660,ex officio,annat,i tjänsten,på begäran,ur tvång,vid förfrågan,med samtycke,"På grund av ämbete eller befattning, utan särskild begäran.",Domstolen prövade frågan ex officio innan parterna fick yttra sig.,juridik,3,curated,"på tjänstens vägnar,från ämbete,formellt",Latinskt uttryck`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const sep = before.endsWith("\n") ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
