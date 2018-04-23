var ignoreWords=["og", "fra", "for", "av", "å", "på", "etter", "med", "gjennom", "noen", "til", "i"];

var offline = true;

function printIgnoredWords()
{
    var html = "";
	for(var i = 0; i< ignoreWords.length; i++)
	{
	    html += ignoreWords[i] + " ";
	}
	return html;
}

function hentLaereplan(kode, trinn, callback)
{
    var query = getLaereplanQueryForKodeOgTrinn("MAT1-04", "Andre")
	
    sparqlQuery(query, function(data){
        callback(data);
    }); 
}

function getLps(lpKoder, callback)
{
    var lps = [];
    if(offline)
    {
        var noOfLp = lpKoder.length;
        for (var i = 0; i < lpKoder.length; i++) 
        {
            var lpKode = lpKoder[i];
            var lpObject = {lpKode: lpKode, lp: offlineLp[lpKode]};

            lps.push(lpObject);
        }
    }
    else
    {
        var asyncsDone = 0;
        var noOfLp = lpKoder.length;
        for (var i = 0; i < lpKoder.length; i++) 
        {
            var lpKode = lpKoder[i];
            var trinn = "andre";
            if(offline)
            {
                lps[lpKode] = offlineLp[lpKode];
            }
            else
            {
                getLaereplanQueryForKodeOgTrinn(lpKode, trinn);
                var href= "/api/v1/courses/" + cid + "/modules/" + m.id + "/items?per_page=100";
                $.getJSON(
                    href,
                    (function(j) {
                        return function(items) {
                            modules[j].items = items;
                            asyncsDone++;

                            if(asyncsDone === noOfModules) {
                                callback(modules);
                            }
                        };
                    }(i)) // calling the function with the current value
                );
            }
        };
    }
    callback(lps);
}

function sparqlQuery(query, callback)
{
    if(offline)
    {
        
    }
	var baseURL="https://data.udir.no/kl06/sparql";
	var	format="application/json";
	var debug="on";
	var timeout="0"

	var params={
		"query": query,
		"debug": debug, 
		"timeout": timeout, 
		"format": format
	};

	var querypart="";
	for(var k in params) {
		querypart+=k+"="+encodeURIComponent(params[k])+"&";
	}
	var queryURL=baseURL + '?' + querypart;

	$.getJSON(queryURL,{}, function(data) {
	 callback(data);
	});
}

function getLaereplanQueryForKodeOgTrinn(kode, trinn)
{
    var queryTemplate	= (function(){ /*
PREFIX u: <http://psi.udir.no/ontologi/kl06/>
PREFIX g: <http://psi.udir.no/kl06/>
PREFIX r: <http://psi.udir.no/ontologi/kl06/reversert/>
PREFIX d: <http://data.udir.no/ontologi/kl06>
 
SELECT DISTINCT ?lp ?lptittel ?trinn ?km ?kmtittel
WHERE {
{
g:{{kode}} u:uri ?lp ;
u:tittel ?lptittel ;
u:har-kompetansemaalsett ?kompetansemaalsett .
FILTER (lang(?lptittel) = '')
}
 
?kompetansemaalsett u:har-etter-aarstrinn ?aarstrinn ;
u:har-kompetansemaal ?km .
 
{
?aarstrinn u:rekkefoelge ?trinnorder ;
u:tittel ?trinn .
FILTER regex(?trinn, "{{trinn}}", "i")
FILTER (lang(?trinn) = '')
}
?km u:tittel ?kmtittel .
FILTER (lang(?kmtittel) = '')
 
?km r:har-kompetansemaal ?kms .
 
}
ORDER BY ?lp ?trinnorder ?kms ?km
*/}).toString().split('\n').slice(1, -1).join('\n');	

    var queryA = queryTemplate.replace("{{kode}}", kode);
    var query = queryA.replace("{{trinn}}", trinn);

    console.log(query);
    return query;
}

function getKompetanseMaalWords(lps)
{
    var kmWordsArray = [];
	for(var j = 0; j < lps.length; j++)
	{
        var bindings = lps[j].lp.results.bindings;
        for(var i = 0; i < bindings.length; i++)
        {
            var ord = [];
            //Trim fjerner mellomrom i begynnelsen og slutten av setningen. Det ser
            //nemlig ut til at det er noen ekstra mellomrom her og der i kompetansemålene.
            var km = bindings[i].kmtittel.value; 
            var kmt = km.trim(); 
            var kmWords = kmt.split(" ");
            var cleanWordArray = getCleanWordArray(kmWords);
            var uniqueWordArray = getUniqueWords(cleanWordArray);
            for(var k = 0; k < uniqueWordArray.length; k++)
            {
                var w = uniqueWordArray[k].text;
                var kmWord = kmWordsArray[w];
                if(!kmWord)
                {
                    kmWord = kmWordsArray[w] = uniqueWordArray[k];
                    kmWord.lps = [];
                }
                
                var kmLp = kmWord.lps[lps[j].lpKode];
                if(!kmLp)
                {
                    var lpObject = {lpKode:lps[j].lpKode, bindings: []};
                    kmLp = kmWord.lps[lps[j].lpKode] = lpObject;
                }

                kmWord.size += uniqueWordArray[j].size;
                if(!kmLp)
                {
                    console.log("kmLp er ikke definert.");
                }
                kmLp.bindings.push(bindings[i]);
            }
        }
    }
    return kmWordsArray;
}

function getCleanWordArray(kmWords)
{
    var kmWordsArray = [];
    for(var j = 0; j< kmWords.length; j++)
    {
        var ord = kmWords[j].replace(/[^a-åA-Å0-9]/g,'')
        if(!ignoreWords.includes(ord))
        {
            kmWordsArray.push(ord);
        }
    }
    return kmWordsArray;
}


function getUniqueWords(kmWordsArray)
{   
    var words = [];
    
    if(!kmWordsArray.length)
    {
        return words;
    }
    

    var size = 1;
    var previousWord = "";
    var word = "";

    previousWord = kmWordsArray[0];
    word = previousWord;

    for(var i = 1; i< kmWordsArray.length; i++)
    {
        var word = kmWordsArray[i];
        if(previousWord != word)
        {
            var wordObject = {text: previousWord, size: size};
            words.push(wordObject);
            previousWord = word;
            size = 1;
        }
        else
        {
            size = size + 1;
        }
    }
    var wordObject = {text: word, size: size};
    words.push(wordObject);
    return words;
}

function GetKmWordsForWordCloud(kmWordsArray)
{
    var words = getUniqueWords(kmWordsArray);
    
    words.sort(function(item1, item2){
        if (item1.size < item2.size)
          return -1;
        if ( item1.size > item2.size)
          return 1;
        return 0;
    });
    return words;
}

function printWords(elementId,words)
{
	var e = $('#' + elementId);
	if (e ==  null) {
	    return;
	}
    var html = "<table><tr><th>Ord</th><th>Antall</th></tr>";
    for(var i = 1; i< words.length; i++)
    {
        html += "<td>" + words[i].text + "</td><td>" + words[i].size + "</td></tr>";
    }
    html += "</table>";
    e.html(html);
}

//Print ordene words som wordcloud i element med id=elementId
function printWordCloud(elementId, words)
{
	var wordcloud = $('#' + elementId);
	if (wordcloud ==  null) {
	    return;
	}
	$("#wordcloud").html("");
    var startDomain;
    var stopDomain;
    if (words.length) {
  	  startDomain = words[0].size;
	  stopDomain = words[words.length - 1].size;
    }	
    var calculateFontSize = d3.scale.linear()
		.domain([startDomain, stopDomain])
		.range([10, 100]);

	var fill = d3.scale.category20();

	var layout = d3.layout.cloud()
		.size([500, 500])
		.words(words)
		.padding(5)
		.rotate(function() { return 0; })
		.font("Impact")
		.fontSize(function(d) { return calculateFontSize(d.size); })
		.on("end", draw);

	layout.start();

	function draw(words) {

	  d3.select("#wordcloud").append("svg")
		  .attr('viewBox', '0 0 ' + layout.size()[0] + ' ' + layout.size()[1])
		  .attr('class','svg-content')
		  .append("g")
		  .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
		  .selectAll("text")
		  .data(words)
		  .enter().append("text")
		  .style("font-size", function(d) { return d.size + "px"; })
		  .style("font-family", "Impact")
		  .style("fill", function(d, i) { return fill(i); })
		  .attr("text-anchor", "middle")
		  .attr("transform", function(d) {
			return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
		  })
		  .text(function(d) { return d.text; });
	}

}

//Hvis man ikke har nett...
var offlineLp = [];
offlineLp["NOR1-05"] =
{ "head": { "link": [], "vars": ["lp", "lptittel", "trinn", "km", "kmtittel"] },
  "results": { "distinct": false, "ordered": true, "bindings": [
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K8361" }	, "kmtittel": { "type": "literal", "value": "fortelle sammenhengende om opplevelser og erfaringer" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K8365" }	, "kmtittel": { "type": "literal", "value": "vise forst\u00E5else for sammenhengen mellom spr\u00E5klyd og bokstav og mellom talespr\u00E5k og skriftspr\u00E5k " }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K8367" }	, "kmtittel": { "type": "literal", "value": "lese store og sm\u00E5 trykte bokstaver" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K8370" }	, "kmtittel": { "type": "literal", "value": "bruke egne kunnskaper og erfaringer for \u00E5 forst\u00E5 og kommentere innholdet i leste tekster" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15391" }	, "kmtittel": { "type": "literal", "value": "lytte, ta ordet etter tur og gi respons til andre i samtaler" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15392" }	, "kmtittel": { "type": "literal", "value": "lytte til tekster p\u00E5 bokm\u00E5l og nynorsk og samtale om dem" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15393" }	, "kmtittel": { "type": "literal", "value": "lytte etter, forst\u00E5, gjengi og kombinere informasjon" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15394" }	, "kmtittel": { "type": "literal", "value": "leke, improvisere og eksperimentere med rim, rytme, spr\u00E5klyder, stavelser, meningsb\u00E6rende elementer og ord" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15395" }	, "kmtittel": { "type": "literal", "value": "samtale om hvordan valg av ord, stemmebruk og intonasjon skaper mening" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15396" }	, "kmtittel": { "type": "literal", "value": "sette ord p\u00E5 egne f\u00F8lelser og meninger" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15397" }	, "kmtittel": { "type": "literal", "value": "uttrykke egne tekstopplevelser gjennom ord, tegning, sang og andre estetiske uttrykk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15398" }	, "kmtittel": { "type": "literal", "value": "trekke lyder sammen til ord" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15399" }	, "kmtittel": { "type": "literal", "value": "lese enkle tekster med sammenheng og forst\u00E5else p\u00E5 papir og skjerm" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15400" }	, "kmtittel": { "type": "literal", "value": "skrive setninger med store og sm\u00E5 bokstaver og punktum i egen h\u00E5ndskrift og p\u00E5 tastatur" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15401" }	, "kmtittel": { "type": "literal", "value": "skrive enkle beskrivende og fortellende tekster" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15402" }	, "kmtittel": { "type": "literal", "value": "arbeide kreativt med tegning og skriving i forbindelse med lesing" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15403" }	, "kmtittel": { "type": "literal", "value": "skrive etter m\u00F8nster av enkle eksempeltekster og ut fra andre kilder for skriving" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15404" }	, "kmtittel": { "type": "literal", "value": "samtale om opphavet til og betydningen av noen kjente ordtak, begreper og faste uttrykk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15405" }	, "kmtittel": { "type": "literal", "value": "samtale om begrepene dialekt, bokm\u00E5l og nynorsk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15406" }	, "kmtittel": { "type": "literal", "value": "samtale om hvordan ord og bilde virker sammen i bildeb\u00F8ker og andre bildemedier" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15407" }	, "kmtittel": { "type": "literal", "value": "samtale om innhold og form i eldre og nyere sanger, regler og dikt" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15408" }	, "kmtittel": { "type": "literal", "value": "samtale om personer og handling i eventyr og fortellinger" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/NOR1-05" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i norsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K15409" }	, "kmtittel": { "type": "literal", "value": "finne skj\u00F8nnlitteratur og sakprosa p\u00E5 biblioteket til egen lesing" }} ] } }
;
    
offlineLp["ENG1-03"] =
{ "head": { "link": [], "vars": ["lp", "lptittel", "trinn", "km", "kmtittel"] },
  "results": { "distinct": false, "ordered": true, "bindings": [
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14783" }	, "kmtittel": { "type": "literal", "value": "gi eksempler p\u00E5 noen situasjoner der det kan v\u00E6re nyttig \u00E5 kunne engelsk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14784" }	, "kmtittel": { "type": "literal", "value": "finne ord og uttrykk som er felles for engelsk og eget morsm\u00E5l" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14785" }	, "kmtittel": { "type": "literal", "value": "bruke digitale ressurser i opplevelse av spr\u00E5ket" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14786" }	, "kmtittel": { "type": "literal", "value": "lytte etter og bruke engelske spr\u00E5klyder gjennom praktisk-estetiske uttrykksm\u00E5ter" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14787" }	, "kmtittel": { "type": "literal", "value": "lytte til og forst\u00E5 enkle instruksjoner p\u00E5 engelsk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14788" }	, "kmtittel": { "type": "literal", "value": "lytte til og forst\u00E5 ord og uttrykk i engelskspr\u00E5klige rim, regler, sanger, eventyr og fortellinger" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14789" }	, "kmtittel": { "type": "literal", "value": "forst\u00E5 og bruke noen engelske ord, uttrykk og setningsm\u00F8nstre knyttet til n\u00E6re omgivelser og egne interesser" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14790" }	, "kmtittel": { "type": "literal", "value": "hilse, stille og svare p\u00E5 enkle sp\u00F8rsm\u00E5l og bruke noen h\u00F8flighetsuttrykk" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14791" }	, "kmtittel": { "type": "literal", "value": "delta i enkle inn\u00F8vde dialoger og spontane samtaler knyttet til n\u00E6re omgivelser og egne opplevelser " }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14792" }	, "kmtittel": { "type": "literal", "value": "bruke tall i samtale om n\u00E6re omgivelser og egne opplevelser" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14793" }	, "kmtittel": { "type": "literal", "value": "kjenne igjen sammenhengen mellom noen engelske spr\u00E5klyder og stavem\u00F8nstre" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14794" }	, "kmtittel": { "type": "literal", "value": "eksperimentere med \u00E5 lese og skrive engelske ord, uttrykk og enkle setninger knyttet til n\u00E6re omgivelser og egne interesser" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14795" }	, "kmtittel": { "type": "literal", "value": "samtale om sider ved barns dagligliv i engelskspr\u00E5klige land" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14796" }	, "kmtittel": { "type": "literal", "value": "ta del i og oppleve barnekultur fra engelskspr\u00E5klige land gjennom \u00E5 bruke ord, bilder, musikk og bevegelse" }},
    { "lp": { "type": "uri", "value": "http://psi.udir.no/kl06/ENG1-03" }	, "lptittel": { "type": "literal", "value": "L\u00E6replan i engelsk" }	, "trinn": { "type": "literal", "value": "Andre \u00E5rstrinn" }	, "km": { "type": "uri", "value": "http://psi.udir.no/kl06/K14797" }	, "kmtittel": { "type": "literal", "value": "gi uttrykk for egne opplevelser av engelskspr\u00E5klige rim, regler, sanger, eventyr og fortellinger" }} ] } };
    
    