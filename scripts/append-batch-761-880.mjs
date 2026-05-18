// Combined allmän (761-816) + kultur (817-880) batch — 120 words
// New semantic-balance rules: heavy on fixed phrases, archaic-literary, native Swedish

import fs from "node:fs";
import path from "node:path";

const CSV_PATH = path.resolve("ord-database.csv");

const rows = [
  // ===== ALLMÄN 56 =====
  // sb diff 1 (7)
  `761,vana,sb,sedvänja,nyhet,undantag,tillfällighet,val,Något som ofta upprepas och blir naturligt över tid.,Hans vana att läsa innan sömnen följde honom genom livet.,allmän,1,curated,"rutin,gammal sed",`,
  `762,enhet,sb,samhörighet,splittring,delning,variation,oenighet,Tillstånd av att utgöra en sammanhängande helhet.,Familjens enhet bestod trots de svåra åren som följde.,allmän,1,curated,"enighet,enhetlighet,samling",`,
  `763,föremål,sb,objekt,tanke,känsla,idé,upplevelse,"Konkret sak som kan ses, hållas eller hanteras.",Föremålet på bordet visade sig vara en gammal släktklenod.,allmän,1,curated,"ting,sak,artikel",`,
  `764,värdighet,sb,moralisk styrka,yttre prakt,snabb framgång,ekonomisk vinst,kort förmåga,Inre känsla av eget värde och respekt.,Hon bemötte kritiken med stor värdighet under hela presskonferensen.,allmän,1,curated,"självrespekt,värdesinne,heder",`,
  `765,dygd,sb,rättskaffenhet,last,brist,synd,svaghet,Moralisk kvalitet som anses god och eftersträvansvärd.,Ärlighet räknas som en hög dygd hos politiker i sägnen.,allmän,1,curated,"god egenskap,moralisk förtjänst,tro",Formellt register`,
  `766,fördelning,sb,distribution,samling,centralisering,insamling,koncentration,Att dela ut eller sprida ut något över flera mottagare.,Fördelningen av tillgångarna gav upphov till en lång familjekonflikt.,allmän,1,curated,"utdelning,spridning",`,
  `767,avsikt,sb,ändamål,tillfällighet,slump,misstag,ovetskap,Den underliggande planen eller motivet bakom en handling.,Hans avsikt var aldrig att såra någon med kommentarerna.,allmän,1,curated,"syfte,mening,baktanke",`,
  // sb diff 2 (15)
  `768,bestyr,sb,göromål,vila,avkoppling,nöje,semester,Mängd småsysslor som måste skötas i vardagen.,Hennes dagliga bestyr lämnade föga tid till annat.,allmän,2,curated,"sysslor,åtaganden,uppdrag",Formellt register`,
  `769,bryderi,sb,huvudbry,tröst,glädje,klarhet,enkelhet,Tillstånd av förvirring eller besvärlig oro inför ett problem.,Problemet med arvet vållade bryderi för hela familjen i månader.,allmän,2,curated,"förbryllande,grubblande,obeslutsamhet",`,
  `770,förargelse,sb,irritation,glädje,tacksamhet,välbehag,lättnad,Känsla av lätt vrede över något oönskat eller orättvist.,Hans försenade ankomst orsakade förargelse hos värdfolket.,allmän,2,curated,"missnöje,ilska,förtret",`,
  `771,omak,sb,besvär,nöje,bekvämlighet,lättnad,vila,Besvär eller olägenhet som någon orsakar en annan.,Han bad om ursäkt för det omak som besöket hade orsakat.,allmän,2,curated,"olägenhet,problem,bekymmer",Formellt register`,
  `772,ovana,sb,olat,dygd,tradition,talang,vana,Dåligt beteendemönster som upprepas omedvetet.,Hans ovana att avbryta andra gjorde honom impopulär i sällskap.,allmän,2,curated,"dålig vana,oart,otygsamhet",`,
  `773,spörsmål,sb,viktig fråga,enkel begäran,kort kommentar,allmän åsikt,formell ursäkt,Fråga av betydelse som kräver eftertänksamhet.,Filosofin tampas med eviga spörsmål om människans natur.,allmän,2,curated,"angelägenhet,problemställning,kärnfråga",Litterärt register`,
  `774,ödmjukhet,sb,brist på högmod,tillit till andra,brist på förtroende,känsla av styrka,övertro på sig,Egenskap att vara medveten om sina begränsningar.,Hans ödmjukhet inför uppgiften vann respekt från kollegorna.,allmän,2,curated,"anspråkslöshet,blygsamhet,ringhet",`,
  `775,avsky,sb,motvilja,tycke,kärlek,beundran,önskan,Stark känsla av äckel eller motvilja inför något.,Han kände tydlig avsky mot grymheten i krigets sista skede.,allmän,2,curated,"vämjelse,leda,fasa",`,
  `776,anletsdrag,sb,ansiktsuttryck,ögonblick,tystnad,gest,suck,Synliga drag och linjer i en persons ansikte.,Hans anletsdrag mörknade när han hörde det dåliga beskedet.,allmän,2,curated,"ansiktsdrag,minspel,gestalt",Litterärt register`,
  `777,fason,sb,uppträdande,utseende,åsikt,uniform,tankesätt,Sätt att bete sig eller uppträda i olika sammanhang.,Hans fason på festen avslöjade hans bristande uppfostran.,allmän,2,curated,"maner,sätt,stil",`,
  `778,förnöjsamhet,sb,belåtenhet,missnöje,avund,längtan,girighet,Förmåga att vara nöjd med det man har.,Hans förnöjsamhet med ett enkelt liv förvånade alla bekanta.,allmän,2,curated,"lugn,tillfredsställelse,inre frid",`,
  `779,medgift,sb,hemgift,arv,gåva,bröllopskostnad,inkomst,Egendom som en brud får med sig in i äktenskapet.,Medgiften som följde flickan var stor nog att bygga ett hus.,allmän,2,curated,"bröllopsgåva,brudegåva,utstyrsel",Ålderdomligt`,
  `780,åtbörd,sb,kroppslig gest,subtilt ord,snabb tanke,hög åsikt,tydlig ton,Rörelse eller gest med kroppen som uttrycker något.,Hans nervösa åtbörd avslöjade att han ljög för publiken.,allmän,2,curated,"gest,uttryck,kroppsspråk",Formellt register`,
  `781,tävlan,sb,tävling,samarbete,enighet,gemenskap,eftergift,Strävan att överträffa andra inom ett område.,Tävlan om makten var hård bland de unga prinsarna i hovet.,allmän,2,curated,"kapplöpning,strid,konkurrens",Litterärt register`,
  `782,aktning,sb,respekt,förakt,nedvärdering,misstro,ringaktning,Känsla av högaktning eller djup respekt för någon.,Hans aktning för läraren visade sig i sättet han talade om honom.,allmän,2,curated,"vördnad,högaktning,beundran",Formellt register`,
  // sb diff 3 (4)
  `783,vederlag,sb,ersättning,gåva,donation,avgift,lån,Belöning eller ersättning för en utförd tjänst.,Han fick gott vederlag för det arbete han lagt ner på projektet.,allmän,3,curated,"kompensation,gottgörelse,betalning",Ålderdomligt; formellt register`,
  `784,fägring,sb,skönhet,fulhet,råhet,enkelhet,styrka,"Stor yttre skönhet, ofta hos en kvinna.",Hennes fägring beskrevs ofta i de gamla balladerna och visorna.,allmän,3,curated,"vacker uppenbarelse,skön gestalt,prakt",Ålderdomligt; litterärt`,
  `785,knipa,sb,trångmål,lättnad,framgång,lugn,seger,Besvärlig och pressande situation som är svår att lösa.,Han hamnade i en knipa när pengarna tog slut mitt i resan.,allmän,3,curated,"klämma,besvärligt läge,bekymmer","Vardagligt; ofta i uttrycket 'i knipa'"`,
  `786,fnurra,sb,oenighet,enighet,samklang,kärlek,respekt,Mindre konflikt eller spänning mellan personer som annars kommer överens.,En liten fnurra på tråden mellan dem fanns kvar efter grälet.,allmän,3,curated,"gräl,knäpp,missämja","Vardagligt; fast uttryck 'fnurra på tråden'"`,
  // adj diff 1 (4)
  `787,ödmjuk,adj,anspråkslös,arrogant,högmodig,självgod,frispråkig,Som inte tror sig vara förmer än andra.,Den ödmjuka konstnären tog emot priset utan stora gester eller tal.,allmän,1,curated,"blygsam,enkel,ringa",`,
  `788,vänskaplig,adj,kamratlig,fientlig,kall,avvisande,reserverad,Som präglas av vänskap eller godhjärtad relation.,Stämningen mellan motståndarna förblev vänskaplig trots den hårda matchen.,allmän,1,curated,"hjärtlig,vänlig,gemytlig",`,
  `789,förnuftig,adj,klok,oöverlagd,tanklös,impulsiv,oklok,Som visar gott omdöme och sunt förstånd.,Det var en förnuftig idé att spara pengar inför pensionen.,allmän,1,curated,"rationell,vettig,sansad",`,
  `790,ovillig,adj,motvillig,villig,benägen,ivrig,beredd,"Som inte vill göra något, ofta utan att säga det öppet.",Han var ovillig att lämna det trygga jobbet trots erbjudandet.,allmän,1,curated,"ohågad,trög,reluktant",`,
  // adj diff 2 (8)
  `791,avlägsen,adj,fjärran,nära,närbelägen,bekant,kort,Som ligger långt borta i tid eller rum.,Den avlägsna staden nåddes först efter tre dagars hård resa.,allmän,2,curated,"långt bort,fjärran belägen,avsides",`,
  `792,häpnadsväckande,adj,överraskande,väntad,förutsägbar,trivial,banal,Så ovanligt eller storartat att det väcker stor förvåning.,Resultatet av experimentet var häpnadsväckande för hela forskargruppen.,allmän,2,curated,"chockerande,förbluffande,beundransvärt",`,
  `793,iögonfallande,adj,lätt att se,svår att märka,dold för flesta,gömd i mörker,glömd bland andra,Som omedelbart drar till sig blicken eller uppmärksamheten.,Hennes iögonfallande klädsel fick alla blickar att vändas mot henne.,allmän,2,curated,"tydlig,uppenbar,påfallande",`,
  `794,egensinnig,adj,envis,medgörlig,foglig,eftergiven,anpasslig,Som följer sin egen vilja utan att lyssna på andra.,Den egensinniga konstnären lyssnade aldrig på kritikernas råd.,allmän,2,curated,"trotsig,stursk,självrådig",`,
  `795,nödtorftig,adj,knapphändig,riklig,generös,överflödig,praktfull,Som bara räcker till för det allra nödvändigaste.,Måltiden var nödtorftig men räddade dem genom den långa vandringen.,allmän,2,curated,"bristfällig,knapp,armod",Formellt register`,
  `796,omsorgsfull,adj,noggrann,slarvig,vårdslös,oaktsam,nonchalant,Som ägnar varje detalj uppmärksamhet med stor noggrannhet.,Den omsorgsfulla läraren rättade varje uppgift med röd penna i marginalen.,allmän,2,curated,"minutiös,detaljerad,påpasslig",`,
  `797,förbehållslös,adj,fullständig,villkorad,begränsad,delvis,tveksam,Utan reservation eller villkor av något slag.,Hon gav sitt förbehållslösa stöd åt vännen genom den svåra tiden.,allmän,2,curated,"oreserverad,ovillkorlig,bestämd",`,
  `798,långsiktig,adj,med lång framsyn,med kort syfte,för dagens behov,utan tanke framåt,av spontan natur,Som tar hänsyn till vad som händer långt fram i tiden.,Den långsiktiga planen krävde uthållighet av alla inblandade i projektet.,allmän,2,curated,"framåtblickande,uthållig,strategisk",`,
  // adj diff 3 (2)
  `799,ovedersäglig,adj,som inte kan ifrågasättas,som ofta blir debatterad,som kan tolkas olika,som låter sig diskuteras,som väcker stor osäkerhet,Som inte kan motbevisas eller bestridas.,Bevisen var ovedersägliga och försvaret kunde inte göra mer.,allmän,3,curated,"oomkullrunkelig,obestridlig,definitiv",Formellt register`,
  `800,överskuggande,adj,dominerande,underordnad,tillfällig,försumbar,obetydlig,Som överröstar eller väger tyngre än allt annat.,Den överskuggande oron för framtiden präglade hela familjens samtal.,allmän,3,curated,"överlägsen,massiv,allenarådande",Litterärt register`,
  // vb diff 1 (3)
  `801,uppmana,vb,anmoda,avråda,förbjuda,avstå,tystna,"Att aktivt be eller uppfordra någon att handla på visst sätt.",Polisen uppmanade allmänheten att vara på sin vakt mot bedragarna.,allmän,1,curated,"be,uppfordra,föreslå",`,
  `802,yrka,vb,kräva,föreslå,godkänna,neka,avstyrka,"Att officiellt kräva eller begära något, ofta i debatt.",Han yrkade på högre löner för all personal i förvaltningen.,allmän,1,curated,"fordra,begära,plädera för",Formellt register`,
  `803,förebrå,vb,anklaga,berömma,prisa,uppskatta,försvara,Att klandra någon för en handling eller försummelse.,Han förebrådde sig själv för att inte ha varnat sina vänner.,allmän,1,curated,"klandra,banna,åthuta",Formellt register`,
  // vb diff 2 (3 single)
  `804,anförtro,vb,yppa,tiga,dölja,undanhålla,mörka,Att berätta något hemligt för en person man litar på.,Hon anförtrodde sin bästa vän alla detaljer kring den nya planen.,allmän,2,curated,"avslöja,delge i förtroende,meddela",Formellt register`,
  `805,åstadkomma,vb,prestera,misslyckas,avstå,ge upp,undvika,Att med ansträngning lyckas skapa eller utföra något.,Trots motgångarna åstadkom hon ett mästerverk på bara tre månader.,allmän,2,curated,"skapa,göra,bringa till stånd",`,
  `806,befrämja,vb,gynna,hindra,försvåra,motverka,bromsa,Att aktivt främja eller stödja en utveckling.,Den nya policyn befrämjade jämställdheten på arbetsplatsen påtagligt.,allmän,2,curated,"främja,stödja,gagna",Formellt register`,
  // vb diff 2 (2 fixed phrase)
  `807,stå pall,vb,hålla stånd,ge vika,ta avstånd,falla samman,dra sig undan,Att motstå påtryckningar eller utmaningar utan att ge efter.,Hon stod pall mot kritiken och fullföljde sitt beslut till slutet.,allmän,2,curated,"hålla ut,motstå,stå emot",Fast uttryck`,
  `808,ge tonen,vb,sätta standarden,följa flocken,ta täten,undvika ansvar,dra sig undan,Att avgöra hur något ska gå till genom sitt egna agerande.,Chefens entusiasm gav tonen för hela företagets framtida arbete.,allmän,2,curated,"leda,sätta sin prägel,föregå med exempel","Fast uttryck; bildligt — från musik"`,
  // vb diff 3 (2 fixed phrase)
  `809,tappa fattningen,vb,förlora kontrollen,bevara lugnet,agera kontrollerat,hålla balansen,tänka klart,Att förlora självbehärskningen i en stressad situation.,Han tappade fattningen när han hörde nyheten om sin mors bortgång.,allmän,3,curated,"bli ifrån sig,bli upprörd,brista i lugn",Fast uttryck; bildligt`,
  `810,höja på ögonbrynen,vb,visa förvåning,nicka instämmande,sucka tungt,le brett,sluta lyssna,Att uttrycka mild förvåning eller skepsis genom ansiktet.,Förslaget fick alla i salen att höja på ögonbrynen lätt.,allmän,3,curated,"bli förvånad,bli förbryllad,reagera skeptiskt","Fast uttryck; bildligt — kroppsspråk"`,
  // adv (4)
  `811,förvisso,adv,sannerligen,knappast,kanske,möjligen,trots,Med säkerhet och utan tvivel om det som påstås.,Det är förvisso sant att klimatet ändras snabbare än väntat.,allmän,1,curated,"visst,faktiskt,definitivt",Litterärt register`,
  `812,i tysthet,adv,utan väsen,med oljud,högljutt offentligt,inför alla,med besked,Stillsamt och utan att väcka uppmärksamhet.,Han genomförde ändringarna i tysthet utan att informera kollegorna.,allmän,2,curated,"ljudlöst,utan rop,diskret",Fast uttryck`,
  `813,av princip,adv,enligt övertygelse,mot principen,utan tanke,ur slentrian,för pengar,På grund av en bestämd uppfattning man håller fast vid.,Hon vägrade av princip att handla från företaget med dåliga arbetsvillkor.,allmän,2,curated,"principiellt,av övertygelse,grundläggande",Fast uttryck`,
  `814,städse,adv,alltid,aldrig,sällan,ibland,tillfälligt,"Alltid och utan undantag, ofta i högtidligt språk.",Han var städse beredd att hjälpa till när behovet uppstod.,allmän,3,curated,"jämt,för evigt,oavbrutet",Ålderdomligt; litterärt`,
  // annat (2)
  `815,i grevens tid,annat,precis lagom,för sent,alltför tidigt,vid sidan,av misstag,I sista möjliga ögonblicket innan det blir för sent.,Hjälpen kom i grevens tid när situationen var som värst.,allmän,3,curated,"i sista stund,precis i tid,knapphändigt","Fast uttryck; bildligt — 'greven' från gamla folksägner"`,
  `816,i sinom tid,annat,vid rätt tillfälle,efter lång väntan,utan vidare väntan,i fel sammanhang,vid sista chansen,När den rätta stunden infinner sig och inte tidigare.,Han kommer att förstå sammanhanget i sinom tid när tiden mognat.,allmän,3,curated,"när tiden är mogen,med tiden,så småningom","Fast uttryck; ålderdomligt — 'sinom' gammal form av sin"`,

  // ===== KULTUR 64 =====
  // sb diff 1 (8)
  `817,saga,sb,berättelse,fakta,rapport,dokument,statistik,Påhittad fantasifull historia ofta med moralisk poäng.,Bedstemodern berättade en saga om en modig prinsessa varje kväll.,kultur,1,curated,"folksaga,fabel,historia",`,
  `818,legend,sb,myt,fakta,vetenskap,bekräftelse,protokoll,Berättelse om historiska personer som blandat fantasi och verklighet.,Legenden om Kung Arthur har levt vidare i tusen år.,kultur,1,curated,"sägen,folklore,mytisk berättelse",Latinskt lånord`,
  `819,prosa,sb,berättarspråk,lyrik,rim,sång,formel,Skriven text utan versmått eller rim.,Romanen var skriven i en lyrisk prosa som påminde om dikter.,kultur,1,curated,"löpande text,romanform,texttyp",`,
  `820,lyrik,sb,poesi,prosa,roman,debatt,facklitteratur,Bunden text på vers som uttrycker känslor eller tankar.,Lyriken under romantiken behandlade naturens skönhet och kärleken.,kultur,1,curated,"diktning,poesi,versdiktning",`,
  `821,parodi,sb,efterapning,original,hyllning,allvar,kritik,Komisk imitation som driver med ett verk eller en person.,Filmen var en parodi på Hollywoods stora hjältesagor under sjuttiotalet.,kultur,1,curated,"satir,karikatyr,gyckel",Grekiskt lånord`,
  `822,tradition,sb,sedvänja,nyhet,trend,uppfinning,avbrott,Bruk eller sed som förts vidare genom generationer.,Midsommarfirandet är en stark tradition i hela Sverige.,kultur,1,curated,"sed,bruk,kulturarv",`,
  `823,skulptur,sb,skulpturverk,målning,teckning,foto,film,Tredimensionellt konstverk format ur sten eller annat material.,Skulpturen på torget hade stått där sedan artonhundratalet.,kultur,1,curated,"staty,plastiskt verk,konstverk",`,
  `824,mästerverk,sb,storverk,försök,skiss,kladd,utkast,Konstnärligt arbete av högsta kvalitet och betydelse.,Romanen anses idag vara ett mästerverk av svensk litteratur.,kultur,1,curated,"klassiker,toppverk,praktverk",`,
  // sb diff 2 (17)
  `825,aforism,sb,kort visdomssats,långrandig essä,vetenskaplig studie,enkel anekdot,sluten dikt,Kort träffande tankesats som uttrycker en livssanning.,Wittgensteins aforismer påverkade både filosofi och litteratur.,kultur,2,curated,"sentens,maxim,levnadsregel",`,
  `826,arketyp,sb,ursprunglig modell,sentida kopia,praktiskt verktyg,tillfälligt försök,kort exempel,Grundläggande mönster eller urbild som återkommer i berättelser.,Den vise gamle mannen är en arketyp i mycket av världens litteratur.,kultur,2,curated,"urbild,prototyp,grundmönster",Grekiskt lånord`,
  `827,dramaturg,sb,scenförfattare,romanförfattare,illustratör,journalist,korrekturläsare,Den som skapar eller bearbetar text för teaterscenen.,Dramaturgen omarbetade pjäsen så att den passade för en modern publik.,kultur,2,curated,"pjäsförfattare,teaterskapare,scenkonstnär",`,
  `828,etymologi,sb,lära om ordet,studie av meningar,grammatisk regel,uttalskonst,översättningslära,Vetenskap om ords ursprung och historiska utveckling.,Etymologin för ordet hus visar gemensamma rötter med tyskan.,kultur,2,curated,"språkhistoria,ordhistoria,ordens ursprung",Grekiskt lånord`,
  `829,gobeläng,sb,bonad,målning,glasruta,filt,matta,Stor vävd bildbonad ofta med scener från historien.,Gobelängen i salen visade en jakt från sextonhundratalet.,kultur,2,curated,"väggbonad,bildvävnad,tapetväv",Franskt lånord`,
  `830,impressionism,sb,intryckskonst,realistisk avbildning,abstrakt geometri,fotografisk skärpa,exakt återgivning,Konstriktning som fångar ljuset och stundens intryck.,Monets impressionism revolutionerade den franska målarkonsten på artonhundratalet.,kultur,2,curated,"stämningsmåleri,ljusmåleri",`,
  `831,klagovisa,sb,sång om sorg,fest om glädje,beskrivning av plats,hyllning till hjälte,bön till gud,Sång som uttrycker djup sorg eller saknad.,Diktarens klagovisa över den döda vännen blev en klassiker.,kultur,2,curated,"sorgesång,elegi,jeremiad",`,
  `832,mosaik,sb,bildsammansättning,enskild ruta,solid yta,målning på duk,skissad teckning,Bild gjord av många små stenar eller färgglada delar.,Mosaiken i kyrkans tak visade hela skapelseberättelsen i ett enda verk.,kultur,2,curated,"bildkomposition,stenmönster,inläggning",Italienskt lånord`,
  `833,ode,sb,högtidsdikt,enkel ramsa,kort visa,banal pjäs,kort prosa,Högtidlig dikt skriven till någons ära.,Skalden skrev ett ode till sommaren och dess ljusa nätter.,kultur,2,curated,"hyllningsdikt,högsång,prisdikt",Grekiskt lånord`,
  `834,pamflett,sb,stridsskrift,romantisk bok,vetenskaplig artikel,facklitteratur,uppslagsverk,Kortare skrift som skarpt angriper någon eller något.,Pamfletten gick rakt på sak och fick stort genomslag i samtiden.,kultur,2,curated,"smädeskrift,kampskrift,nidskrift",Franskt lånord`,
  `835,patos,sb,känsloglöd,kall logik,intellektuell distans,nykter analys,formell ton,Stark känsla eller glöd som genomsyrar tal och konst.,Talet höll ett patos som rörde åhörarna till tårar.,kultur,2,curated,"känslolaster,inspirerad ton,glöd",Grekiskt lånord`,
  `836,ritual,sb,ceremoni,vardagsbestyr,tillfällig handling,spontant infall,improviserat möte,Bestämd handling eller ordning utförd vid högtidliga tillfällen.,Bröllopsritualen följde gamla traditioner från flera hundra år tillbaka.,kultur,2,curated,"ceremoniel,ordning,seremoni",Latinskt lånord`,
  `837,sägen,sb,folkberättelse,bevisad fakta,vetenskaplig studie,offentlig rapport,formell historia,Berättelse som spridits muntligt och rör verkliga eller mytiska händelser.,Sägnen om sjöns vita dam berättades av varje generation i byn.,kultur,2,curated,"legend,sagohistoria,folkmin",`,
  `838,sonett,sb,fjortonradig dikt,kort haiku,lång roman,prosastycke,fri vers,Diktform på fjorton rader med bestämt rim- och versmått.,Shakespeares sonetter har översatts till nästan alla världens språk.,kultur,2,curated,"versdikt,kvartsdikt,kärleksdikt",Italienskt lånord`,
  `839,trilogi,sb,trefaldsverk,enskild bok,kort novell,blandad samling,tvådelad pjäs,Sammanhängande serie av tre verk inom samma berättelse.,Trilogin om ringen blev en av filmhistoriens största succéer.,kultur,2,curated,"trebandsverk,treverk,trilogiserie",`,
  `840,ärekränkning,sb,smädande,beröm,upprättelse,erkännande,respekt,Yttrande eller skrift som skadar någons goda namn.,Författaren stämdes för ärekränkning av den politiker hon beskrivit.,kultur,2,curated,"förtal,vanrykte,skändning",`,
  `841,fanfar,sb,högtidssignal,viskning,knapp ton,långsam visa,instrument utan ljud,Kort högtidlig trumpetsignal som inleder ceremonier.,Kungaparet hälsades av en fanfar när de steg in i salen.,kultur,2,curated,"hornsignal,trumpetstöt,festsignal",Franskt lånord`,
  // sb diff 3 (5)
  `842,anakronism,sb,fel i tid,riktig tidsplacering,modern detalj,historisk noggrannhet,korrekt sammanhang,Något som placerats fel i tiden eller är ur sin tid.,Filmens anakronism med moderna armbandsur störde tittarna.,kultur,3,curated,"tidsfel,tidsförväxling,otidsenlighet",Grekiskt lånord`,
  `843,elegi,sb,sorgesång,festdikt,kort visa,enkel ramsa,humoristisk vers,Långsam vemodig dikt om förlust eller saknad.,Skaldens elegi över den döda vännen blev en klassiker i litteraturen.,kultur,3,curated,"klagosång,sorgedikt,minnesdikt",Grekiskt lånord`,
  `844,sirat,sb,utsmyckning,vardaglig sak,enkel form,oprydd yta,grov struktur,Konstfärdigt ornament eller dekorativt prydnadsverk.,Renässansfasaden var rik på sirater och ornament i sten.,kultur,3,curated,"ornament,prydnad,utsirning",Ålderdomligt`,
  `845,skirhet,sb,finhet,grovhet,tyngd,massivhet,plumphet,Egenskapen att vara lätt och genomskinligt vacker.,Slöjans skirhet förhöjde brudens utseende i kyrkans ljus.,kultur,3,curated,"finess,lätthet,delikatess",Litterärt register`,
  `846,ikonografi,sb,studie av bilder,studie av ord,studie av musik,studie av platser,studie av dans,Vetenskap om symbolik och bildspråk i konsten.,Ikonografin för Maria-bilder följer strikta regler i ortodox tradition.,kultur,3,curated,"bildanalys,bildlära,symbolforskning",Grekiskt lånord`,
  // adj diff 1 (4)
  `847,folklig,adj,av folket,elitistisk,otillgänglig,exklusiv,överklassen,Som tilltalar bredare lager av befolkningen.,Den folkliga melodin sjöngs på fester över hela landet.,kultur,1,curated,"populär,allmän,jordnära",`,
  `848,konstnärlig,adj,kreativ,banal,praktisk,vardaglig,själlös,Som hör samman med konst och dess uttryckssätt.,Hans konstnärliga ådra visade sig tidigt i barndomen redan.,kultur,1,curated,"skapande,artistisk,konstrik",`,
  `849,harmonisk,adj,välljudande,disharmonisk,skärande,oren,oljudande,Som är välklingande eller väl avstämd i sina delar.,Den harmoniska musiken fick åhörarna att slappna av helt.,kultur,1,curated,"välstämd,samklang,balanserad",`,
  `850,praktfull,adj,storartad,enkel,torftig,blygsam,vardaglig,Som är ståtlig och fylld av yttre skönhet eller pomp.,Den praktfulla salen pryddes av kristallkronor och gyllene tapeter.,kultur,1,curated,"magnifik,grandios,storslagen",`,
  // adj diff 2 (10)
  `851,abstrakt,adj,oåskådlig,konkret,verklig,handfast,påtaglig,Som inte direkt avbildar något i den synliga världen.,Den abstrakta målningen krävde tolkning från betraktaren.,kultur,2,curated,"icke-figurativ,idémässig,tankebaserad",`,
  `852,arkaisk,adj,ålderdomlig,modern,nutida,fräsch,trendig,Som hör till en mycket gammal tid eller ser så ut.,Det arkaiska språket i texten gjorde den svår att förstå idag.,kultur,2,curated,"forntida,gammaldags,föråldrad",Grekiskt lånord`,
  `853,bombastisk,adj,överdriven,enkel,nedtonad,saklig,blygsam,Som är pompös och överdrivet uppblåst i sitt uttryck.,Talet var bombastiskt och fyllt av tomma fraser utan substans.,kultur,2,curated,"pompös,svulstig,högtravande",`,
  `854,fantasifull,adj,uppfinningsrik,fantasilös,trist,bokstavlig,banal,Som visar mycket inbillningskraft och kreativitet.,Den fantasifulla berättelsen tog läsarna till en helt annan värld.,kultur,2,curated,"kreativ,uppfinnande,föreställningsrik",`,
  `855,grotesk,adj,förvridet ful,vacker harmonisk,naturligt enkel,sober elegant,fint avstämd,Som är förvriden eller överdriven på ett ofta skrämmande sätt.,Den groteska figuren i romanen jagade huvudpersonen genom drömmarna.,kultur,2,curated,"vrångbild,bisarr,absurd",Italienskt lånord`,
  `856,lyrisk,adj,poetisk,prosaisk,saklig,nykter,affärsmässig,Som hör samman med poesi eller har dess känslosamma drag.,Den lyriska tonen i hans prosa gav romanen en särskild skönhet.,kultur,2,curated,"diktarrik,sångbar,känslosam",`,
  `857,ornamenterad,adj,utsmyckad,oprydd,kal,enkel,minimal,Försedd med dekorativa mönster eller utsmyckningar.,Kistans ornamenterade lock visade rika scener ur gammal historia.,kultur,2,curated,"prydd,dekorerad,utsirad",`,
  `858,sublim,adj,över allt vardagligt,vardaglig grå,banal trivial,enkel skissartad,råbarkad direkt,Som är upphöjd och har en överjordisk skönhet.,Solnedgången var sublim och slog alla i sällskapet med stum tystnad.,kultur,2,curated,"upphöjd,andlig storartad,majestätisk",Latinskt lånord`,
  `859,vemodig,adj,tyngd av sorg,glad och lätt,rolig och pigg,oberörd kall,sorglös fri,Som präglas av en mild och eftertänksam sorg.,Hans vemodiga blick avslöjade att han mindes barndomen.,kultur,2,curated,"vemodsfull,sorgmodig,melankolisk",`,
  `860,vältalig,adj,skicklig i tal,fåordig blyg,oartikulerad mumlande,osammanhängande tystlåten,tystlåten reserverad,Som talar med stor förmåga att uttrycka tankar.,Den vältaliga prästen drog stora skaror till varje predikan.,kultur,2,curated,"vältalad,sirligt formulerad,retoriskt skicklig",`,
  // adj diff 3 (3)
  `861,elegisk,adj,sorgsen och vacker,glad och pigg,rolig och lätt,direkt och hård,vardaglig och simpel,Som är präglad av sorgsen vemodig stämning.,Den elegiska tonen i poesin passade temat om livets förgänglighet.,kultur,3,curated,"sorgsamt vacker,vemodig,klagosångsaktig",Grekiskt lånord`,
  `862,monumentell,adj,av imponerande storhet,blygsam och liten,vardaglig och anspråkslös,kortvarig och flyktig,enkel och ringa,Så storartad och bestående att den väcker djup beundran.,Bygget av katedralen var ett monumentellt verk som tog flera sekler.,kultur,3,curated,"storslagen,majestätisk,massiv",Latinskt lånord`,
  `863,pompös,adj,pråligt högtidlig,sober nedtonad,enkel återhållsam,vardaglig naturlig,blygsam diskret,Som är överdrivet högtidlig och uppblåst.,Den pompösa ceremonin pågick i fyra timmar utan paus.,kultur,3,curated,"bombastisk,pretentiös,uppblåst",Franskt lånord`,
  // vb diff 1 (4)
  `864,skildra,vb,beskriva,dölja,förvränga,förtiga,försköna,Att framställa något i ord eller bild med tydlighet.,Romanen skildrade livet i Stockholms slumkvarter under nittonhundratalet.,kultur,1,curated,"återge,framställa,porträttera",`,
  `865,berömma,vb,prisa,kritisera,håna,nedvärdera,fördöma,Att tala uppskattande om någon eller något.,Kritikerna berömde regissörens nya film i de stora tidningarna.,kultur,1,curated,"hylla,uppskatta,lovorda",`,
  `866,imitera,vb,härma,uppfinna,skapa,utveckla,nyttja,Att efterlikna någons sätt eller röst för effekt.,Komikern imiterade statsministern så bra att alla skrattade.,kultur,1,curated,"kopiera,efterapa,plagiera",`,
  `867,komponera,vb,tonsätta,improvisera,härma,översätta,recitera,Att skapa ett musikstycke genom att skriva och kombinera toner.,Beethoven komponerade sin nionde symfoni när han redan var döv.,kultur,1,curated,"skriva musik,sätta ihop,strukturera",`,
  // vb diff 2 (6 single + 1 fixed multi = 7)
  `868,gestalta,vb,framställa,dölja,förvränga,förtiga,förvanska,Att forma och ge konkret uttryck åt en idé eller karaktär.,Skådespelaren gestaltade hamletkaraktären med stor inlevelse och djup.,kultur,2,curated,"forma,utforma,levandegöra",`,
  `869,avbilda,vb,återge,dölja,förvränga,förstöra,glömma,Att framställa någon eller något i bild- eller texttform.,Konstnären avbildade staden så som den såg ut för hundra år sedan.,kultur,2,curated,"återge,porträttera,illustrera",`,
  `870,diktera,vb,föreskriva,föreslå,fråga,tveka,viska,Att med makt bestämma vad någon annan ska göra eller skriva.,Ledaren dikterade villkoren och ingen vågade säga emot.,kultur,2,curated,"befalla,föreskriva,uppmana",Latinskt lånord`,
  `871,recitera,vb,framsäga,nynna,viska,uppfinna,glömma,Att högt och tydligt framsäga en text eller dikt.,Eleven reciterade dikten utantill för hela klassen.,kultur,2,curated,"deklamera,framsäga,uppläsa",Latinskt lånord`,
  `872,tonsätta,vb,musikalisera,översätta,skriva,illustrera,förkorta,Att skapa en melodi som passar till en text.,Kompositören tonsatte poetens dikter och de blev populära visor.,kultur,2,curated,"komponera till,musikbelägga,sätta i musik",`,
  `873,föreviga,vb,bestående framställa,kortvarigt visa,tillfälligt nämna,snabbt glömma,mödosamt sudda,Att bevara minnet av något genom konst eller skrift.,Skulptören förevigade hjälten i en staty mitt på torget.,kultur,2,curated,"odödliggöra,bestående minnas,monumentalisera",Formellt register`,
  `874,väcka uppmärksamhet,vb,dra blickar,gå obemärkt,försvinna obemärkt,smyga försiktigt,glömmas bort,Att få andra att lägga märke till något särskilt.,Hennes ovanliga klädsel väckte uppmärksamhet vid varje gala.,kultur,2,curated,"sticka ut,göra intryck,bli noterad",Fast uttryck`,
  // vb diff 3 (1)
  `875,besjunga,vb,prisa i sång,håna i tal,kritisera i prosa,glömma i tystnad,nedvärdera offentligt,Att med dikter eller sånger högtidligt prisa något.,Skalden besjöng hjältens dåd i en lång ballad.,kultur,3,curated,"prisas i vers,höra i sång,hylla med dikt",Litterärt register`,
  // adv (4)
  `876,elegant,adv,sirligt,klumpigt,plumpt,grovt,oslipat,På ett behagfullt och förfinat sätt.,Hon rörde sig elegant över parketten under hela kvällen.,kultur,1,curated,"smakfullt,graciöst,med stil",Franskt lånord`,
  `877,pittoreskt,adv,måleriskt,oansenligt,torftigt,trist,prosaiskt,På ett bildmässigt vackert sätt.,Den lilla byn låg pittoreskt vid stranden av en stilla sjö.,kultur,2,curated,"bildskönt,charmigt,tilltalande",Italienskt lånord`,
  `878,med eftertryck,adv,med kraft,utan vikt,försiktigt avvaktande,oroligt tvekande,viskande mjukt,Med tydlig betoning som visar allvar och bestämdhet.,Han uttalade orden med eftertryck så ingen kunde missa budskapet.,kultur,2,curated,"emfatiskt,bestämt,kraftfullt",Fast uttryck`,
  `879,i blickfånget,adv,centralt synlig,utanför sikten,gömd undan,bortom uppmärksamhet,vid sidan av,På den plats där alla blickar riktas.,Hon stod i blickfånget mitt på scenen när musiken började.,kultur,3,curated,"i centrum,iögonfallande,framträdande","Fast uttryck; bildligt"`,
  // annat (1)
  `880,i ropet,annat,allmänt eftertraktad,bortglömd helt,opopulär nu,föråldrad redan,gömd undan,Mycket populär eller eftertraktad just nu.,Den unga författaren var i ropet hos kritikerna det året.,kultur,3,curated,"populär,modern,på modet",Fast uttryck; bildligt`,
];

const before = fs.readFileSync(CSV_PATH, "utf8");
const sep = before.endsWith("\n") ? "" : "\n";
const out = before + sep + rows.join("\n") + "\n";
fs.writeFileSync(CSV_PATH, out, "utf8");
console.log(`Appended ${rows.length} rows. File size: ${out.length} bytes.`);
