import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  // --- substantiv, diff 1 (6) ---
  `561,diagnos,sb,sjukdomsbedömning,undersökning,journalanteckning,behandlingsplan,symtombild,Bedömning som fastställer vilken sjukdom en patient har.,Läkaren ställde en diagnos efter flera dagar av prover och undersökningar.,medicin,1,curated,"bedömning,diagnostisering,sjukdomsfastställelse",`,
  `562,inflammation,sb,vävnadsretning,missbildning,blödning,blåsbildning,varbildning,"Kroppens reaktion på skada eller smitta med rodnad och värme.",Inflammationen i knäet gjorde det svårt att gå utan smärta.,medicin,1,curated,"vävnadsskada,irritation",`,
  `563,epidemi,sb,utbrott,smittohärd,sjukdomsbild,karantänsläge,vårdskuld,Snabb spridning av en sjukdom inom en befolkning eller region.,Influensaepidemin tog hårt i regionen och vårdpersonalen jobbade övertid hela vintern.,medicin,1,curated,"smittspridning,sjukdomsvåg",`,
  `564,amputation,sb,bortoperation,transplantation,sutur,ympning,fixering,Kirurgiskt avlägsnande av en kroppsdel som en arm eller ett ben.,Efter den svåra olyckan blev amputation av högra benet oundvikligt.,medicin,1,curated,"avlägsnande,borttagning",`,
  `565,karantän,sb,isolering,avskärmning,husarrest,frihetsberövande,spärrtid,Tvingande avskildhet för att förhindra smittspridning i samhället.,De anlände från utlandet och sattes i karantän i fjorton dagar.,medicin,1,curated,"avskildhet,smittisolering",Italienskt lånord`,
  `566,syndrom,sb,symtombild,sjukdomsförlopp,kroppsreaktion,behandlingsförlopp,hälsotillstånd,Samling av symtom som regelbundet uppträder tillsammans.,Patienter med detta syndrom uppvisar ofta liknande beteendemönster och svårigheter.,medicin,1,curated,"sjukdomskomplex,symtomgrupp",`,
  // --- substantiv, diff 2 (14) ---
  `567,åkomma,sb,krämpa,bot,lyte,ohälsa,gnäll,Mindre svår sjukdom eller fysiskt besvär.,Han led av en envis åkomma som plågade honom i veckor.,medicin,2,curated,"plåga,besvär,lidande",`,
  `568,åderbråck,sb,ådersvulst,blodpropp,blåmärke,åderförkalkning,ödembildning,"Permanent utvidgad och buktande blodåder, ofta i benen.",Många äldre utvecklar åderbråck efter år av stillasittande arbete och övervikt.,medicin,2,curated,"varicer,utvidgade ådror",`,
  `569,ingrepp,sb,kirurgisk åtgärd,medicinskt prov,fysisk undersökning,terapeutisk behandling,klinisk visit,Aktiv åtgärd i kroppen för medicinskt eller kirurgiskt syfte.,Det krävdes ett komplicerat ingrepp för att avlägsna den infekterade vävnaden.,medicin,2,curated,"operation,åtgärd",`,
  `570,remission,sb,avmattning,försämring,försvinnande,stabilisering,återhämtning,Period då sjukdomssymtom minskar eller försvinner tillfälligt.,Cancerpatienten gick in i en period av remission efter behandlingen.,medicin,2,curated,"tillbakagång,symtomfrihet",Latinskt lånord`,
  `571,protes,sb,ersättningsdel,bandage,gips,krycka,förband,Konstgjord kroppsdel som ersätter en saknad eller skadad del.,Han fick en ny protes efter att ha förlorat benet i kriget.,medicin,2,curated,"implantat,konstgjord lem",Grekiskt lånord`,
  `572,intubation,sb,luftrörsinläggning,andningstest,syrgastillförsel,ventilation,sondmatning,Inläggning av rör i luftvägen för att underlätta andning.,Patienten behövde akut intubation efter den allvarliga olyckan på motorvägen.,medicin,2,curated,"trakealtubning,rörinläggning",`,
  `573,katarakt,sb,starr,blödning,näthinneavlossning,ögoninflammation,ögonryckning,Grumling av ögats lins som försämrar synen gradvis.,Den äldre patienten behandlades framgångsrikt för katarakt på båda ögonen.,medicin,2,curated,"grå starr,linsgrumling",Grekiskt lånord`,
  `574,hypertoni,sb,blodtrycksförhöjning,pulshöjning,syrebrist,andnöd,hjärtklappning,Permanent förhöjt tryck i blodkärlen som belastar hjärtat.,Obehandlad hypertoni ökar risken för stroke och hjärtinfarkt avsevärt.,medicin,2,curated,"högt blodtryck,blodtrycksstegring",Grekiskt lånord`,
  `575,nedstämdhet,sb,dysterhet,ilska,oro,trötthet,lättja,Tillstånd av varaktig sorg eller låg sinnesstämning.,"Hans nedstämdhet växte under den långa, mörka vintern hemma.",medicin,2,curated,"melankoli,svårmod,apati",`,
  `576,avmagring,sb,minskning i vikt,höjning av puls,minskning av aptit,ökning av törst,försvagning av muskler,Märkbar minskning av kroppsvikt på grund av sjukdom eller hunger.,Den långvariga avmagringen oroade läkarna när de inte fann någon orsak.,medicin,2,curated,"viktnedgång,utmärgling",`,
  `577,svindel,sb,yrsel,huvudvärk,illamående,trötthet,synrubbning,Känsla av att omgivningen snurrar eller man själv tappar balansen.,Han drabbades av plötslig svindel när han reste sig från sängen.,medicin,2,curated,"yrhet,balansrubbning",Även betydelse 'bedrägeri'`,
  `578,sömnlöshet,sb,insomni,yrsel,nattskräck,drömrubbning,apné,Oförmåga att somna eller sova en hel natt regelbundet.,Långvarig sömnlöshet kan leda till nedsatt koncentration och försämrad hälsa.,medicin,2,curated,"sömnsvårigheter,sömnbesvär",`,
  `579,abstinens,sb,avvänjningsbesvär,beroende,tolerans,missbruk,återfall,Kroppsliga och psykiska besvär när en beroendeframkallande substans försvinner.,Patienten led av svår abstinens under den första veckans avvänjning.,medicin,2,curated,"avvänjningssymtom,utsättningsbesvär",Latinskt lånord`,
  `580,blodbrist,sb,anemi,blödning,syrebrist,vätskebrist,kärlbristning,Tillstånd med för få röda blodkroppar eller hemoglobin i blodet.,Hennes ständiga trötthet visade sig bero på allvarlig blodbrist.,medicin,2,curated,"blodfattigdom,hemoglobinbrist",`,
  // --- substantiv, diff 3 (3) ---
  `581,recidiv,sb,återfall,rehabilitering,eftervård,försämring,behandlingsavbrott,Återkomst av sjukdom efter en period av tillfrisknande.,Två år efter operationen drabbades patienten tyvärr av recidiv.,medicin,3,curated,"återinsjuknande,nyutbrott",Latinskt lånord`,
  `582,profylax,sb,förebyggande åtgärd,kurativ behandling,akut intervention,palliativ vård,kronisk behandling,Åtgärder som syftar till att förhindra att sjukdom uppstår.,Vaccination är en effektiv profylax mot många allvarliga infektioner.,medicin,3,curated,"prevention,förebyggande",Grekiskt lånord`,
  `583,nekros,sb,vävnadsdöd,blodförgiftning,vävnadssvullnad,missbildning,nervskada,Lokal celldöd i kroppens vävnader på grund av sjukdom eller skada.,Operationen krävdes för att avlägsna det område där nekros uppstått.,medicin,3,curated,"celldöd,vävnadsdestruktion",Grekiskt lånord`,
  // --- adjektiv, diff 1 (4) ---
  `584,akut,adj,plötsligt påkommen,långsamt utvecklad,länge bestående,varaktigt försämrad,lätt övergående,Som uppstår plötsligt och kräver omedelbar behandling.,Patienten skickades till akut vård efter den plötsliga bröstsmärtan.,medicin,1,curated,"brådskande,plötslig",`,
  `585,kronisk,adj,varaktig,tillfällig,infektiös,läkbar,övergående,Långvarig eller ständigt återkommande över lång tid.,Hans kroniska ryggsmärtor begränsade honom i det dagliga livet.,medicin,1,curated,"långvarig,bestående,permanent",`,
  `586,ofarlig,adj,harmlös,livshotande,allvarlig,smittsam,giftig,Som inte utgör någon risk eller skada för hälsan.,Bulan visade sig vara helt ofarlig efter en grundlig undersökning.,medicin,1,curated,"harmfri,riskfri,oskadlig",`,
  `587,smärtfri,adj,värkfri,bedövad,känslolös,värkande,sjuklig,Helt utan smärta eller obehag i kroppen.,Efter operationen var patienten smärtfri redan efter ett par dagar.,medicin,1,curated,"smärtlindrad,utan värk",`,
  // --- adjektiv, diff 2 (7) ---
  `588,patologisk,adj,sjukligt förändrad,friskt utvecklad,naturligt förekommande,lätt påverkad,kliniskt obetydlig,Som hör till eller är orsakad av sjukdom.,Provet visade patologiska förändringar i levervävnaden hos patienten.,medicin,2,curated,"sjukdomsrelaterad,onormal",`,
  `589,benign,adj,godartad,malign,aggressiv,spridande,inflammerad,Som är ofarlig och inte sprider sig till andra vävnader.,Tumören visade sig vara benign och kunde avlägsnas utan komplikationer.,medicin,2,curated,"harmlös,ofarlig",Latinskt lånord`,
  `590,malign,adj,elakartad,benign,godartad,kronisk,inflammerad,Som sprider sig och hotar liv eller hälsa allvarligt.,Diagnosen visade att tumören var malign och krävde omedelbar behandling.,medicin,2,curated,"ondartad,livshotande",Latinskt lånord`,
  `591,terminal,adj,i slutskede,i tidigt skede,under långsam läkning,i akut fas,vid full återhämtning,Som befinner sig i sjukdomens sista och oåterkalleliga fas.,Den terminala patienten flyttades till hospice för att få lugn vård.,medicin,2,curated,"döende,obotlig,palliativ",`,
  `592,somatisk,adj,kroppslig,mental,psykisk,ärftlig,miljöbetingad,Som rör kroppens fysiska tillstånd snarare än det psykiska.,Läkaren skilde tydligt mellan somatiska och psykiska orsaker till besvären.,medicin,2,curated,"fysisk,kroppsbunden",Grekiskt lånord`,
  `593,inflammatorisk,adj,inflammationsorsakad,degenerativ,genetisk,infektiös,kronisk,Som beror på eller karaktäriseras av kroppens inflammation.,De inflammatoriska besvären försvann först efter en längre tids medicinering.,medicin,2,curated,"inflammationsbärande,inflammationsrelaterad",`,
  `594,smittsam,adj,överförbar,ärftlig,allergisk,ofarlig,läkbar,Som lätt sprids från en person till en annan.,Sjukdomen är mycket smittsam och kräver strikt isolering av patienten.,medicin,2,curated,"smittobärande,kontagiös",`,
  // --- adjektiv, diff 3 (2) ---
  `595,letal,adj,med dödlig utgång,med god prognos,med långsam förlopp,med ofarliga symtom,med snabb återhämtning,Som leder till döden eller har dödlig verkan.,Den letala dosen av giftet hade redan börjat påverka centralnervsystemet.,medicin,3,curated,"dödlig,fatal",Latinskt lånord`,
  `596,komatös,adj,medvetslös,vaken,sövd,domnad,slö,Som befinner sig i djup medvetslöshet utan respons.,Efter olyckan låg patienten i komatöst tillstånd i flera dagar.,medicin,3,curated,"omtöcknad,djupt sövd",Grekiskt lånord`,
  // --- verb, diff 1 (3) ---
  `597,operera,vb,utföra ingrepp,undersöka kroppen,lägga om,ge medicin,testa blodet,Att kirurgiskt åtgärda eller behandla en patient genom snitt.,Kirurgen opererade patienten under flera timmar för att rädda livet.,medicin,1,curated,"utföra kirurgi,skära i",`,
  `598,vaccinera,vb,immunisera,medicinera,bedöva,behandla,desinficera,Att tillföra ett ämne som ger skydd mot smittsam sjukdom.,Barnen vaccinerades mot mässling innan de började i skolan.,medicin,1,curated,"ympa,inokulera",`,
  `599,lindra,vb,dämpa,förvärra,försämra,öka,dröja,Att minska eller mildra känsla av smärta eller obehag.,Tabletterna lindrade hennes huvudvärk inom en kvart efter intag.,medicin,1,curated,"mildra,minska,stilla",`,
  // --- verb, diff 2 (6) ---
  `600,tillfriskna,vb,återhämta sig,falla samman,försämras tydligt,drabbas igen,brytas ner,Att gradvis återfå hälsan efter sjukdom eller skada.,Hon tillfrisknade snabbt efter den långa konvalescensen på sjukhuset.,medicin,2,curated,"friskna till,bli frisk,läkas",`,
  `601,ådra sig,vb,drabbas av,behandlas för,läkas från,hela sig,tillfriskna från,Att förvärva eller drabbas av en sjukdom eller skada.,Han ådrog sig en lunginflammation efter veckor i kalla rummet.,medicin,2,curated,"drabbas,smittas av,bli sjuk i",Reflexivt verb`,
  `602,amputera,vb,bortoperera,transplantera,bandagera,sutera,bedöva,Att kirurgiskt avlägsna en kroppsdel som ett ben eller en arm.,Läkarna tvingades amputera foten för att förhindra spridning av infektion.,medicin,2,curated,"avlägsna,skära bort,operera bort",`,
  `603,diagnosticera,vb,identifiera,behandla,bota,åtgärda,lindra,Att medicinskt bestämma vilken sjukdom en patient har.,Specialisten diagnosticerade sällsynta autoimmuna sjukdomen efter flera tester.,medicin,2,curated,"fastställa,bestämma sjukdom,undersöka",`,
  `604,konvalescera,vb,läkas,försämras,insjukna,smittas,försvagas,Att tillfriskna gradvis efter sjukdom eller operation.,Hon konvalescerade hemma i tre veckor efter den krävande operationen.,medicin,2,curated,"tillfriskna,återhämta sig,helas",Latinskt lånord`,
  `605,infektera,vb,smitta,bota,vaccinera,lindra,sterilisera,Att överföra sjukdomsalstrande mikroorganismer till en kropp eller vävnad.,Såret blev infekterat eftersom bandaget inte byttes regelbundet.,medicin,2,curated,"kontaminera,påverka med smitta",`,
  // --- verb, diff 3 (1) ---
  `606,recidivera,vb,få återfall,tillfriskna helt,behandlas framgångsrikt,hela snabbt,immuniseras mot,Att drabbas av återfall i en sjukdom efter förbättring.,Patienten recidiverade tre månader efter att behandlingen avslutats.,medicin,3,curated,"återinsjukna,få bakslag,drabbas igen",Latinskt lånord`,
  // --- adverb (3) ---
  `607,sterilt,adv,fritt från bakterier,i kontrollerad miljö,med kemisk rengöring,vid hög temperatur,under operatörens uppsikt,På ett sätt som är fritt från smittämnen och bakterier.,Operationssalen hölls sterilt under hela det fyra timmar långa ingreppet.,medicin,1,curated,"bakteriefritt,utan smittämnen",Latinskt lånord`,
  `608,kirurgiskt,adv,med operation,med medicinering,via injektion,genom diet,med rehabilitering,Genom kirurgi eller operation som behandlingsmetod.,Tumören avlägsnades kirurgiskt under en två timmar lång operation.,medicin,2,curated,"operativt,genom snitt,med ingrepp",`,
  `609,profylaktiskt,adv,i förebyggande syfte,efter pågående sjukdom,vid lätta symtom,under akuta besvär,med snabb verkan,På ett sätt som förebygger sjukdom eller skada.,Antibiotika ges ibland profylaktiskt inför stora operationer för att förhindra infektion.,medicin,3,curated,"preventivt,förebyggande,i preventionssyfte",Grekiskt lånord`,
  // --- annat (1) ---
  `610,in vivo,annat,i levande organism,på död vävnad,utanför levande kropp,i konstgjord miljö,vid lägre temperatur,Som sker inuti en levande kropp snarare än i laboratorium.,Studien testades först i provrör och sedan in vivo på möss.,medicin,3,curated,"i levande kropp,i kroppen",Latinskt uttryck`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const sep = before.endsWith("\n") ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
