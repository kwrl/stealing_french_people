var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

var base_url = "http://genearmor.cotesdarmor.fr/moteur/";
var post_url = base_url+'gapatience.php';

var form = {
    TRONYME : "",
    PRENOM : "",
    PATRONYME: "Marie",
    CONJOINT : "",
    B1 : "Rechercher",
    SOURCE : "0",
    TYPE : "T",
    TRI : "A"
}

function getSecondURL(url) {

	request.get(url, {}, function(error, response, html) {
		var $ = cheerio.load(html);

		var table = $("table:first-of-type");
		table.find('tr:first-of-type').remove();
		table.find('tr').each(function(index, value) {
			var person = {};
			$(value).children("td").each(function(index, value) {
				switch(index) {
					case 0:
						var url = base_url+$(value).children("a").attr("href");
						person.fullname=$(value).text();
						request.get(url , function(error, response, html) {
							var $ = cheerio.load(html);
							person.extra = $(".texte_std2").text();
							if(person.extra!='' && person.fullname!='') {
								console.log(person);
							}
						});
						break;
					case 1:
						person.parents=$(value).text();
						break;
				}
			});
		});
	});
}

function getURL(url) {
	request.get(url, {}, function(error, response, html) {
		var $ = cheerio.load(html);
		var url = base_url+$('meta').attr('content').substr(8);
		getSecondURL(url);
	});
}
app.get('/scrape', function(req, res) {
    request.post(post_url, {form : form},
        function(error, response, html) {
            var $ = cheerio.load(html);
            var url = base_url+$("FRAME").attr('src');
			getURL(url);
        });
    res.send("Started");
});

app.listen('8081');
exports = module.exports = app;

