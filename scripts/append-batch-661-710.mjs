import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  // --- substantiv diff 1 (6) ---
  `661,hypotes,sb,vetenskaplig gissning,bevisad slutsats,slumpmässig observation,allmän slutsats,definierad lag,Antagande som ska prövas genom systematisk undersökning.,Forskarna formulerade en hypotes om sambandet mellan kost och hälsa.,vetenskap,1,curated,"antagande,teori,arbetsteori",Grekiskt lånord`,
  `662,gen,sb,arvsanlag,cell,kromosom,virus,molekyl,Ärftlig enhet som styr biologiska egenskaper hos en organism.,Genen för ögonfärg ärvs från båda föräldrarna till barnet.,vetenskap,1,curated,"ärftlig enhet,arvsenhet",`,
  `663,partikel,sb,smådel,våg,atom,helhet,strömning,Mycket liten beståndsdel av materia.,Forskare studerar hur partiklar beter sig vid nästintill absoluta nollpunkten.,vetenskap,1,curated,"minsta beståndsdel,korn,bit",Latinskt lånord`,
  `664,erosion,sb,långsam nötning,snabb utveckling,plötslig förändring,tillfällig påverkan,ihållande tillväxt,"Gradvis nedbrytning av landytan genom vind, vatten eller is.",Erosionen längs kusten har gjort att stranden krympt med flera meter.,vetenskap,1,curated,"nötning,vittring,markförslitning",`,
  `665,mutation,sb,arvsförändring,anpassning,avvikelse,evolution,rörelse,Förändring i arvsmassan som kan föras vidare till nästa generation.,Mutationen gav arten en fördel som spred sig snabbt i populationen.,vetenskap,1,curated,"arvsanlagsförändring,genmutation",`,
  `666,ekvation,sb,likhet,olikhet,kvot,summa,faktor,Matematiskt uttryck där två sidor är lika med varandra.,Eleverna fick lösa en svår ekvation med två okända variabler.,vetenskap,1,curated,"formel,matematisk likhet",`,
  // --- substantiv diff 2 (14) ---
  `667,empiri,sb,erfarenhet,teori,spekulation,uppfattning,åskådning,Kunskap som bygger på systematisk observation och experiment.,Slutsatsen byggde på rik empiri från tjugo års forskning i området.,vetenskap,2,curated,"praktisk erfarenhet,observation,sinneserfarenhet",Grekiskt lånord`,
  `668,korrelation,sb,samband mellan variabler,orsak till händelse,slump utan mönster,likhet mellan grupper,skillnad mellan värden,Statistiskt samband mellan två eller flera variabler.,Forskarna fann tydlig korrelation mellan kost och allmän hälsa.,vetenskap,2,curated,"statistiskt samband,medvariation",Latinskt lånord`,
  `669,symbios,sb,ömsesidigt beroende,rovaktigt levande,parasitärt förhållande,fientlig konkurrens,ensam tillvaro,Nära samliv mellan två olika arter till nytta för båda.,Korallreven är beroende av symbios mellan alger och små djur.,vetenskap,2,curated,"samliv,ömsesidighet,mutualism",Grekiskt lånord`,
  `670,adaptation,sb,anpassning till miljö,motstånd mot förändring,kompromiss med omgivning,isolering från värld,kamp mot natur,Evolutionär process där en art utvecklar egenskaper för sin omgivning.,Tjock päls är en typisk adaptation hos djur i kalla områden.,vetenskap,2,curated,"anpassning,evolutionsanpassning",`,
  `671,katalysator,sb,påskyndare,hämmare,buffert,reagens,lösningsmedel,Ämne som ökar hastigheten på en kemisk reaktion utan att förbrukas.,Platinakatalysatorn i bilen omvandlar skadliga avgaser till mindre farliga ämnen.,vetenskap,2,curated,"aktivator,påskyndande ämne",Grekiskt lånord`,
  `672,amplitud,sb,utslagsstorlek,frekvens,period,fas,intensitet,Maximal storlek på en vågs utslag från jämviktsläget.,Vågornas amplitud ökade dramatiskt under stormen ute på havet.,vetenskap,2,curated,"vågutslag,svängningsstorlek",Latinskt lånord`,
  `673,isotop,sb,atomvariant,molekyl,jon,element,förening,Variant av samma grundämne med olika antal neutroner.,Forskarna spårade isotopen genom hela ekosystemet under flera år.,vetenskap,2,curated,"kärnsortvariant,grundämnesvariant",Grekiskt lånord`,
  `674,spektrum,sb,våglängdsfördelning,prisma,ljusstråle,intensitet,frekvens,Fördelning av ljus eller annan strålning över olika våglängder.,Solens spektrum innehåller hela skalan av synligt ljus och mer därtill.,vetenskap,2,curated,"våglängdsband,ljusfördelning,strålningsspektrum",Latinskt lånord`,
  `675,exponent,sb,potensgrad,bas,faktor,multiplikator,koefficient,Tal som anger hur många gånger basen ska multipliceras med sig själv.,Eleverna lärde sig hur exponenten påverkar resultatet i räkneuppgiften.,vetenskap,2,curated,"upphöjningstal,potensens grad",Latinskt lånord`,
  `676,derivata,sb,förändringstakt,integral,kvot,produkt,summa,Matematiskt mått på hur snabbt en funktion förändras.,Studenterna beräknade derivatan för att hitta funktionens högsta punkt.,vetenskap,2,curated,"deriverad funktion,förändringsmått",Latinskt lånord`,
  `677,replikering,sb,upprepning,variation,avvikelse,slutsats,tillfällighet,Att en studie eller process upprepas för att kontrollera resultatet.,Resultatets giltighet förstärktes av flera oberoende replikeringar av studien.,vetenskap,2,curated,"upprepning av studie,reproducering,duplicering",`,
  `678,arvsmassa,sb,arvsmaterial,arvegods,avlöpare,avkomma,cellkärna,Helheten av en organisms genetiska information.,Forskarna kartlade hela arvsmassan hos den nyupptäckta arten.,vetenskap,2,curated,"genom,arvsanlag,DNA-uppsättning",`,
  `679,ljusbrytning,sb,böjning av ljus,spridning av ljud,reflektion av värme,absorption av ljus,koncentration av energi,Ändring av ljusets riktning när det passerar mellan olika material.,Ljusbrytningen i prismat delade upp ljuset i regnbågens färger.,vetenskap,2,curated,"refraktion,ljusböjning",`,
  `680,urval,sb,stickprov,helhet,population,bortfall,kontroll,Mindre grupp som väljs ut för att representera en större helhet.,Forskarnas urval omfattade femhundra slumpvis utvalda personer från olika regioner.,vetenskap,2,curated,"provgrupp,delpopulation",`,
  // --- substantiv diff 3 (3) ---
  `681,entropi,sb,oordning,ordning,struktur,system,balans,Mått på graden av oordning eller spridning i ett system.,Universums entropi ökar oavbrutet enligt termodynamikens andra huvudsats.,vetenskap,3,curated,"kaos,oordningsmått,termisk spridning",Grekiskt lånord`,
  `682,nebulosa,sb,kosmiskt gasmoln,kompakt stjärna,kosmiskt damm,dunkelt hål,sönderfallande planet,Stort moln av gas och stoft i rymden där stjärnor kan bildas.,Teleskopet fångade en bild av nebulosan på flera tusen ljusårs avstånd.,vetenskap,3,curated,"stjärntäcke,interstellärt moln",Latinskt lånord`,
  `683,refraktion,sb,ljusböjning,reflektion,absorption,spridning,interferens,Att en stråle av ljus eller ljud ändrar riktning vid materialgräns.,Refraktionen i atmosfären gör att solen syns även strax efter solnedgång.,vetenskap,3,curated,"brytning,strålböjning",`,
  // --- adjektiv diff 1 (4) ---
  `684,empirisk,adj,erfarenhetsbaserad,teoretisk,spekulativ,abstrakt,filosofisk,Som bygger på iakttagelse och experimentell observation.,Studien gav empirisk grund för slutsatserna om sömnens betydelse.,vetenskap,1,curated,"observationsbaserad,erfarenhetsmässig",Grekiskt lånord`,
  `685,kvantitativ,adj,mätbar,kvalitativ,abstrakt,beskrivande,historisk,"Som handlar om mängd, antal eller numeriska värden.",Forskningen omfattade både kvantitativ och kvalitativ analys av materialet.,vetenskap,1,curated,"numerisk,mätrelaterad,siffermässig",`,
  `686,statistisk,adj,siffermässig,anekdotisk,slumpmässig,kvalitativ,berättande,Som rör insamling och analys av numeriska data.,Den statistiska analysen visade ett tydligt mönster i resultaten.,vetenskap,1,curated,"kvantitativ,sifferbaserad",`,
  `687,konstant,adj,oförändrad,variabel,tillfällig,avtagande,genomgående,Som inte ändras över tid eller under olika förhållanden.,Temperaturen hölls konstant under hela det två veckor långa experimentet.,vetenskap,1,curated,"oföränderlig,stadig,kontinuerlig",`,
  // --- adjektiv diff 2 (7) ---
  `688,signifikant,adj,statistiskt betydelsefull,slumpmässigt avvikande,tillfälligt observerat,knappt mätbar,jämnt fördelad,Som med stor sannolikhet inte beror på slumpen.,Skillnaden mellan grupperna var signifikant i båda försöksomgångarna.,vetenskap,2,curated,"betydelsefull,utslagsgivande",`,
  `689,replikerbar,adj,upprepningsbar,unik,oreproducerbar,tillfällig,exceptionell,Som kan upprepas under samma villkor och ge samma resultat.,Studiens resultat var replikerbara i flera oberoende laboratorier världen över.,vetenskap,2,curated,"reproducerbar,duplicerbar",`,
  `690,evolutionär,adj,som rör utveckling,som är stabilt,som är artificiellt,som är medfött,som är tillfälligt,Som rör arters långsiktiga utveckling över många generationer.,Den evolutionära förklaringen visade varför arten utvecklat sin särskilda förmåga.,vetenskap,2,curated,"utvecklingsmässig,fylogenetisk",`,
  `691,termisk,adj,värmerelaterad,elektrisk,magnetisk,kemisk,mekanisk,Som hör samman med värme eller temperaturförändringar.,Den termiska expansionen av metallen är något man måste räkna med.,vetenskap,2,curated,"värmebetingad,värmeledande",`,
  `692,molekylär,adj,molekylbaserad,atomär,partikulär,cellulär,makroskopisk,Som rör molekyler eller skeenden på molekylnivå.,Forskarna studerade vattnets molekylära struktur med avancerad mikroskopi.,vetenskap,2,curated,"småskalig kemisk,molekylnivå",Latinskt lånord`,
  `693,adaptiv,adj,anpassningsbar,stelbent,statisk,instinktiv,oberoende,Som har förmåga att anpassa sig till ändrade förhållanden.,Det adaptiva immunsystemet lär sig känna igen nya hot under livet.,vetenskap,2,curated,"flexibel,anpassbar,formbar",`,
  `694,akustisk,adj,ljudbaserad,optisk,elektrisk,termisk,magnetisk,Som rör ljud eller dess utbredning genom material.,Konsertsalens akustiska egenskaper hade förbättrats efter den senaste renoveringen.,vetenskap,2,curated,"ljudmässig,ljudteknisk",`,
  // --- adjektiv diff 3 (2) ---
  `695,antropogen,adj,av människan orsakad,av naturen orsakad,av tillfället skapad,av djuren förorsakad,av ödet bestämd,Som har sitt ursprung i mänsklig verksamhet.,Den antropogena uppvärmningen är ett etablerat vetenskapligt faktum idag.,vetenskap,3,curated,"människoskapad,mänskligt framkallad",Grekiskt lånord`,
  `696,abiotisk,adj,utan levande inslag,med biologisk grund,med organisk ursprung,med levande beståndsdelar,med biologisk aktivitet,Som rör icke-levande faktorer i ett ekosystem.,Temperatur och nederbörd är viktiga abiotiska faktorer för växters tillväxt.,vetenskap,3,curated,"icke-levande,olevande",Grekiskt lånord`,
  // --- verb diff 1 (3) ---
  `697,analysera,vb,granska,anta,gissa,definiera,presentera,Att noggrant undersöka något i dess olika delar.,Forskarna analyserade datamaterialet i flera månader innan de drog slutsatser.,vetenskap,1,curated,"undersöka,utreda,studera",`,
  `698,observera,vb,iaktta,tolka,ignorera,förmoda,beskriva,Att noga lägga märke till något under en längre tid.,Astronomerna observerade himlen i tre nätter innan kometen blev synlig.,vetenskap,1,curated,"betrakta,bevaka,studera",`,
  `699,beräkna,vb,uppskatta,gissa,anta,formulera,jämföra,Att med matematik fastställa ett tal eller värde.,Studenterna beräknade hastigheten på fallande föremål i fysiklaborationen.,vetenskap,1,curated,"kalkylera,bedöma,räkna ut",`,
  // --- verb diff 2 (6) ---
  `700,replikera,vb,upprepa,variera,modifiera,inleda,avsluta,Att utföra en studie eller process på nytt under samma villkor.,Andra forskare lyckades replikera resultaten i två oberoende försök.,vetenskap,2,curated,"göra om,reproducera,duplicera",`,
  `701,katalysera,vb,påskynda,hämma,neutralisera,upplösa,separera,Att med ett ämne öka hastigheten på en kemisk reaktion.,Enzymet katalyserade processen så att den genomfördes hundra gånger snabbare.,vetenskap,2,curated,"driva på,accelerera",`,
  `702,syntetisera,vb,framställa,söndra,isolera,analysera,separera,Att med kemiska metoder framställa ett ämne av andra ämnen.,Forskarna lyckades syntetisera det nya läkemedlet i sitt eget laboratorium.,vetenskap,2,curated,"framställa kemiskt,kombinera,producera",`,
  `703,mutera,vb,förvandlas,stagnera,bevaras,upprepas,förenklas,Att genom genetisk förändring utveckla nya egenskaper.,Viruset hade muterat och bildat en variant som spred sig snabbare.,vetenskap,2,curated,"förändras genetiskt,utvecklas,omformas",`,
  `704,integrera,vb,införliva,separera,katalogisera,redovisa,substituera,Att förena olika delar till en sammanhängande helhet.,Forskarna integrerade data från flera olika källor i sin slutliga modell.,vetenskap,2,curated,"införa,foga samman,kombinera",`,
  `705,destillera,vb,rena,blanda,försvaga,fördela,koka,Att skilja vätskor åt genom uppvärmning och kondensation.,Kemisten destillerade alkoholen ur lösningen för att få en ren produkt.,vetenskap,2,curated,"avdunsta och kondensera,rena genom värme,evaporera",`,
  // --- verb diff 3 (1) ---
  `706,extrapolera,vb,räkna fram,observera direkt,hitta exakt,mäta noggrant,beräkna preliminärt,Att dra slutsatser om okända värden utifrån kända data.,Modellen extrapolerade temperaturdata till år 2100 utan stora osäkerheter.,vetenskap,3,curated,"förlänga,projicera,sträcka ut",`,
  // --- adverb (3) ---
  `707,systematiskt,adv,metodiskt,slumpartat,oregelbundet,snabbt,tillfälligt,På ett ordnat och planmässigt sätt.,Forskarna gick systematiskt igenom proverna under hela höstterminen.,vetenskap,1,curated,"regelbundet,planmässigt,strukturerat",`,
  `708,approximativt,adv,i grova drag,med exakt precision,med fullständig säkerhet,i minsta detalj,utan minsta avvikelse,Ungefär eller med viss avvikelse från det exakta värdet.,Avståndet är approximativt sex ljusår enligt de senaste beräkningarna.,vetenskap,2,curated,"ungefär,nära nog,cirka",`,
  `709,exponentiellt,adv,i snabb takt,i jämn takt,i avtagande hastighet,i linjär utveckling,vid konstant kurva,I en allt snabbare takt som följer en potens-funktion.,Antalet smittade ökade exponentiellt under de första veckorna av pandemin.,vetenskap,3,curated,"i geometrisk takt,snabbt växande,allt snabbare",`,
  // --- annat (1) ---
  `710,in vitro,annat,i provrör,i organism,i miljö,i kropp,på cellnivå,Som genomförs i laboratoriemiljö utanför en levande organism.,Försöket genomfördes först in vitro innan det testades på levande celler.,vetenskap,3,curated,"i laboratorium,utanför kroppen,på glas",Latinskt uttryck`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const sep = before.endsWith("\n") ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
