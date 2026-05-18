import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  // --- substantiv diff 1 (6) ---
  `711,mångfald,sb,variation,enformighet,enkelhet,likformighet,ordning,Stor variation av olika typer eller perspektiv inom samma helhet.,Skolans elever speglade samhällets mångfald av bakgrunder och uppväxtmiljöer.,samhälle,1,curated,"variation och mängd,olikhet,bredd",`,
  `712,folkrörelse,sb,gräsrotsrörelse,statsapparat,parti,lobby,organisation,Bred samhällsrörelse som drivs av många människor underifrån.,Nykterhetsrörelsen var en stor folkrörelse i Sverige under tidigt 1900-tal.,samhälle,1,curated,"massrörelse,medborgarrörelse",`,
  `713,yttrandefrihet,sb,rätt att tala,plikt att tiga,frihet från ansvar,makt över andra,rätt till ägodom,Lagstadgad rätt att uttrycka åsikter utan rädsla för repressalier.,Yttrandefriheten är grundlagsskyddad i Sverige och en demokratisk rättighet.,samhälle,1,curated,"tryckfrihet,åsiktsfrihet",`,
  `714,valdeltagande,sb,röstning vid val,kandidatur i val,finansiering av parti,kampanj inför val,lobbying mot politiker,Andelen röstberättigade som faktiskt avger sin röst i ett val.,Det svenska valdeltagandet ligger högt jämfört med andra europeiska länder.,samhälle,1,curated,"röstprocent,röstningsfrekvens",`,
  `715,utanförskap,sb,utestängning,integration,gemenskap,samvaro,omhändertagande,Att stå utanför samhällets normala gemenskap och delaktighet.,Politikerna ville bekämpa utanförskapet i förorten genom riktade satsningar.,samhälle,1,curated,"marginalisering,segregation,exkludering",`,
  `716,byråkrati,sb,förvaltningsapparat,korruption,demokrati,monarki,anarki,Stort system av regler och tjänstemän inom offentlig förvaltning.,Han fick kämpa länge mot byråkratin för att få sitt tillstånd.,samhälle,1,curated,"tjänstemannavälde,förvaltning",Franskt lånord (bureau = kontor)`,
  // --- substantiv diff 2 (14) ---
  `717,maktbalans,sb,jämvikt mellan parter,konkurrens om makt,splittring inom regering,samarbete mellan partier,dominans hos ledare,Tillstånd där olika maktbärare väger upp varandra och ingen dominerar.,Riksdagens maktbalans ändrades efter valet då två partier förlorade mandat.,samhälle,2,curated,"maktjämvikt,balanserad maktstruktur",`,
  `718,sammanhållning,sb,gemenskap,splittring,individualism,upplösning,motsättning,Stark känsla av samhörighet och enighet i en grupp eller nation.,Krisen stärkte sammanhållningen i samhället på ett oväntat sätt.,samhälle,2,curated,"solidaritet,enighet,enad gemenskap",`,
  `719,folkförsamling,sb,medborgarmöte,regeringssammanträde,partikongress,juridisk stämma,debattklubb,Möte där medborgare samlas för att diskutera gemensamma frågor.,Den lokala folkförsamlingen samlade hundratals invånare till diskussion om planerna.,samhälle,2,curated,"stormöte,allmänt möte",`,
  `720,föresats,sb,avsikt,tillfällighet,slump,oförsiktighet,bekräftelse,Bestämt beslut att utföra en viss handling.,Hennes goda föresats att börja motionera höll i sig hela året.,samhälle,2,curated,"beslut,uppsåt,föresätta sig något",Formellt register`,
  `721,värdegrund,sb,moralisk bas,praktisk regel,känslomässig drift,politisk plattform,ekonomisk grund,Grundläggande etiska principer som styr handlingar och beslut.,Skolans värdegrund betonar respekt och inkludering av alla elever.,samhälle,2,curated,"etisk grund,moralisk plattform,principstomme",`,
  `722,folkstyre,sb,demokrati,envälde,oligarki,monarki,elitstyre,Styrelseskick där medborgarna gemensamt beslutar om samhällets riktning.,Sverige har långa traditioner av folkstyre och demokratiska institutioner.,samhälle,2,curated,"demokratiskt styre,medborgarstyre",`,
  `723,maktdelning,sb,fördelning av makt,koncentration av makt,missbruk av makt,balansering av åsikter,ärvande av poster,Princip om att skilja statens olika maktfunktioner från varandra.,"Maktdelningen mellan riksdag, regering och domstol är central för rättsstaten.",samhälle,2,curated,"maktseparation,maktskillnad",`,
  `724,mandatperiod,sb,tid i ämbete,val i kommun,antal i parti,plats i riksdag,beslut av väljare,Tidsperiod under vilken en folkvald innehar sitt uppdrag.,Mandatperioden för riksdagsledamöter är fyra år i Sverige.,samhälle,2,curated,"ämbetsperiod,uppdragstid",`,
  `725,demografi,sb,befolkningsstatistik,geografi,etnografi,antropologi,sociologi,Vetenskap som studerar befolkningars sammansättning och förändringar.,Sveriges demografi förändras snabbt på grund av lägre födelsetal.,samhälle,2,curated,"folkstatistik,befolkningslära",Grekiskt lånord`,
  `726,polarisering,sb,ökad splittring,minskad konflikt,frivilligt samförstånd,ömsesidigt utbyte,lugn debatt,Att grupper i samhället driver isär i alltmer motsatta läger.,Polariseringen i politiken har ökat under det senaste decenniet.,samhälle,2,curated,"splittring,åsiktsklyvning",`,
  `727,konsensus,sb,gemensam överenskommelse,öppen konflikt,formell avstämning,slutgiltig kompromiss,allmän omröstning,Brett samförstånd där flertalet är överens om något.,Forskarna nådde konsensus om att klimatförändringarna är människoorsakade.,samhälle,2,curated,"samförstånd,enhällighet,enighet",Latinskt lånord`,
  `728,populism,sb,folkfrieri,elitism,teknokrati,pragmatism,idealism,Politisk strategi som spelar på enkla budskap till folkflertalet.,Många politiker anklagas för populism i sin retorik inför valet.,samhälle,2,curated,"folklig demagogi,populärfrieri",`,
  `729,lobbyism,sb,påtryckning för intressen,rådgivning åt politiker,debatt i media,kandidatur för parti,stöd från väljare,Försök att påverka politiska beslut till förmån för särskilda intressen.,Lobbyismen kring miljölagstiftningen blev intensiv inför omröstningen i riksdagen.,samhälle,2,curated,"påverkansarbete,intresseföreträdande",Engelskt lånord`,
  `730,opinionsbildning,sb,påverkan på åsikter,registrering av väljare,mätning av åsikter,urval av kandidater,tolkning av resultat,"Process där folks åsikter formas genom debatt, media och samtal.",Sociala medier har förändrat opinionsbildningen i grunden de senaste åren.,samhälle,2,curated,"åsiktsbildning,åsiktspåverkan",`,
  // --- substantiv diff 3 (3) ---
  `731,åthävor,sb,beteendemässiga uttryck,intellektuella tankar,akademiska åsikter,djupa känslor,fasta planer,Sätt att uppträda eller bete sig i sociala sammanhang.,Hans åthävor på mötet var alltför teatraliska för publiken.,samhälle,3,curated,"beteende,uppträdande,fasoner",Ålderdomligt; ofta i pluralis`,
  `732,dissens,sb,oenighet,enighet,godkännande,instämmande,bekräftelse,Avvikande mening eller öppen oenighet inom en grupp.,Domstolens beslut åtföljdes av en längre skrivelse om dissens från minoriteten.,samhälle,3,curated,"avvikande mening,meningsskiljaktighet",Latinskt lånord`,
  `733,eftermäle,sb,ord efter döden,tal vid begravning,rykte i livstid,samling av minnen,hyllning av närstående,Det rykte och anseende en person lämnar efter sin död.,Statsmannens eftermäle blev större än vad samtiden förstod.,samhälle,3,curated,"postumt rykte,minnesbild,arv",Litterärt register`,
  // --- adjektiv diff 1 (4) ---
  `734,enhällig,adj,enad,splittrad,motvillig,tveksam,enskild,Som omfattar alla utan att någon röstar emot.,Beslutet fattades enhälligt av styrelsen efter en kort diskussion.,samhälle,1,curated,"enstämmig,utan motröster",`,
  `735,röstberättigad,adj,valberättigad,omyndig,avstängd,oregistrerad,olämplig,Som har rätt att rösta i ett politiskt val enligt lag.,Alla röstberättigade får sitt röstkort skickat hem i god tid före valet.,samhälle,1,curated,"med rösträtt,valbar att rösta",`,
  `736,folkkär,adj,omtyckt,kontroversiell,elitistisk,isolerad,oansenlig,Som åtnjuter brett gillande och beundran hos befolkningen.,Den folkkäre politikern fick stort stöd även från andra partier.,samhälle,1,curated,"populär,älskad av folket,uppskattad",`,
  `737,förtroendeingivande,adj,som inger tillit,som väcker misstro,som verkar opålitlig,som lurar lätt,som imponerar ytligt,Som ger ett intryck av pålitlighet och trovärdighet.,Den förtroendeingivande talaren övertygade publiken om sin sak.,samhälle,1,curated,"tillitsskapande,pålitlig,trovärdig",`,
  // --- adjektiv diff 2 (7) ---
  `738,vidsynt,adj,öppen,trångsynt,fördomsfull,engagerad,nyfiken,Som ser saker ur många perspektiv och accepterar olika åsikter.,Hans vidsynta inställning gjorde honom till en respekterad medlare i konflikten.,samhälle,2,curated,"tolerant,fördomsfri,bredsynt",`,
  `739,maktfullkomlig,adj,enväldig,demokratisk,kompromissvillig,folkvald,samarbetsvänlig,Som utövar sin makt utan hänsyn till andra eller till lag.,Den maktfullkomliga ledaren tystade alla kritiska röster i partiet.,samhälle,2,curated,"diktatorisk,allsmäktig,suverän",`,
  `740,polariserad,adj,tudelad,enad,nyanserad,homogen,neutral,Som har drivits isär till två motsatta läger.,Det polariserade debattklimatet gjorde kompromisser svåra att nå i frågan.,samhälle,2,curated,"splittrad,uppdelad,åsiktsklyvd",`,
  `741,partipolitisk,adj,partibunden,oberoende,idépolitisk,neutral,opartisk,Som styrs av eller hör samman med ett politiskt parti.,Frågan blev en partipolitisk strid trots att den var teknisk i grunden.,samhälle,2,curated,"partibetingad,partianknuten",`,
  `742,genomgripande,adj,omfattande,ytlig,begränsad,tillkortakommen,marginell,Som påverkar allt eller alla delar av något i grunden.,Reformen innebar genomgripande förändringar för hela skolsystemet i landet.,samhälle,2,curated,"djupgående,fullständig,radikal",`,
  `743,jämbördig,adj,likställd,överlägsen,underordnad,avvikande,oavslutad,Som befinner sig på samma nivå med någon i förmåga eller status.,De två konkurrenterna var jämbördiga och kampen avgjordes på upploppet.,samhälle,2,curated,"jämställd,likvärdig",Formellt register`,
  `744,maktlysten,adj,härsklysten,blygsam,uppoffrande,försiktig,ödmjuk,Som intensivt eftersträvar att få makt över andra.,Den maktlystna ministern manövrerade sig fram i partiet i åratal.,samhälle,2,curated,"maktbegärlig,ambitionsfull,makthungrig",`,
  // --- adjektiv diff 3 (2) ---
  `745,hegemonisk,adj,dominerande,jämbördig,underordnad,tillfällig,ifrågasatt,Som utövar dominans över andra grupper eller stater.,USA:s hegemoniska ställning i världen har börjat ifrågasättas alltmer.,samhälle,3,curated,"överlägsen,allenarådande",Grekiskt lånord`,
  `746,autokratisk,adj,enväldig,konstitutionell,parlamentarisk,pluralistisk,demokratisk,Som styrs av en enda person utan inblandning från folket.,Det autokratiska styret slog ner alla försök till opposition.,samhälle,3,curated,"diktatorisk,tyrannisk",`,
  // --- verb diff 1 (3) ---
  `747,ifrågasätta,vb,bestrida,bekräfta,instämma,försvara,prisa,Att uttrycka tvivel eller utmana något som tas för givet.,Forskaren ifrågasatte resultaten i den nyligen publicerade studien öppet.,samhälle,1,curated,"utmana,problematisera,sätta i fråga",`,
  `748,avgå,vb,frånträda,tillträda,inta,kandidera,ärva,"Att lämna ett ämbete eller uppdrag, ofta i förtid.",Ministern beslöt att avgå efter den långvariga skandalen.,samhälle,1,curated,"lämna ämbetet,avsäga sig,abdikera",Formellt register`,
  `749,påverka,vb,influera,ignorera,undvika,motarbeta,beundra,Att åstadkomma en förändring i något eller hos någon.,Mediedebatten påverkade opinionen mer än politikerna hade förutsett.,samhälle,1,curated,"inverka på,ha effekt på,prägla",`,
  // --- verb diff 2 (6) ---
  `750,likställa,vb,jämställa,skilja,rangordna,åtskilja,diskriminera,Att behandla två eller flera saker som om de var lika.,Den nya lagen likställde sambopar med gifta i fråga om arv.,samhälle,2,curated,"parallellisera,sätta lika",`,
  `751,avsätta,vb,avlägsna,tillsätta,invälja,behålla,upphöja,Att tvinga någon att lämna ett ämbete eller en hög position.,Generalförsamlingen avsatte ordföranden efter den misstroendeförklaring som restes.,samhälle,2,curated,"störta,avskeda,detronisera",Formellt register`,
  `752,förorda,vb,rekommendera,avråda,avstyrka,nedvärdera,fördöma,Att uttala stöd för eller rekommendera en åtgärd.,Utskottet förordade en höjning av grundavdraget i sin slutrapport.,samhälle,2,curated,"tala för,stödja,plädera för",Formellt register`,
  `753,begagna sig av,vb,använda,avstå,undvika,ignorera,förkasta,Att medvetet ta hjälp av eller utnyttja något.,Försvaret begagnade sig av en juridisk teknikalitet för att vinna fallet.,samhälle,2,curated,"utnyttja,nyttja,dra fördel av","Fast uttryck; reflexivt — 'begagna' är formellt 'använda'"`,
  `754,utse,vb,tillsätta,avsätta,avstå,avstänga,ifrågasätta,Att formellt välja någon till en uppgift eller post.,Riksdagen utsåg den nya talmannen vid sammanträdets början på måndagen.,samhälle,2,curated,"nominera,välja,uppdra åt",Formellt register`,
  `755,röstvärva,vb,kampanja,röstdela,opinionsmäta,valpåverka,lobbyverka,Att aktivt söka stöd från väljare inför ett val.,Politikern röstvärvade i pendeltågen under hela kampanjveckorna.,samhälle,2,curated,"föra valkampanj,jaga röster",`,
  // --- verb diff 3 (1) ---
  `756,gå i bräschen,vb,ta täten,hålla låg,dröja avvaktande,hänga efter,vara passiv,Att stå främst i kampen för en sak eller framsteg.,Hon gick i bräschen för kvinnors rättigheter under hela sitt liv.,samhälle,3,curated,"leda,föregå,banbryta","Fast uttryck; 'bräsch' = öppning i fästningsmur, bildligt"`,
  // --- adverb (3) ---
  `757,samfällt,adv,gemensamt,enskilt,ojämnt,motsträvigt,åtskilt,Tillsammans och på samma sätt utan undantag.,Föreningens medlemmar agerade samfällt mot förslaget om medlemsavgifter.,samhälle,1,curated,"enhälligt,kollektivt",Formellt register`,
  `758,mot strömmen,adv,emot rådande,med rådande,i samklang,med flödet,i takten,Att handla i motsats till vad de flesta tycker eller gör.,Hon valde att gå mot strömmen och stödja den impopulära kandidaten.,samhälle,2,curated,"oppositionellt,trots majoritet",Fast uttryck; bildligt`,
  `759,i förbifarten,adv,vid passerande,efter eftertanke,i förväg,vid slutet,med flit,Helt i förbigående utan att stanna upp eller fokusera.,Han nämnde besluten i förbifarten utan att vänta på reaktioner.,samhälle,3,curated,"i förbigående,kort,obetonat",Fast uttryck`,
  // --- annat (1) ---
  `760,på tapeten,annat,under diskussion,bortom räckhåll,utanför planen,i skrivbordslådan,i otack,Just nu aktuellt och föremål för uppmärksamhet.,Frågan om sjukvårdens framtid är åter på tapeten i debatten.,samhälle,3,curated,"aktuell,i ropet,brännande","Fast uttryck; bildligt — 'tapet' = väggprydnad där viktiga frågor avbildades"`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const sep = before.endsWith("\n") ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
