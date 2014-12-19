var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
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

//mongoose.connect("mongodb://localhost/test");
//var Person = mongoose.model('Person', { fullname : String, parents: String, extra : String });

app.get('/scrape', function(req, res) {
    request.post(post_url, {form : form},
        function(error, response, html) {
            var $ = cheerio.load(html);
            var url = base_url+$("FRAME").attr('src');
            request.get(url, {}, function(error, response, html) {
                var $ = cheerio.load(html);
                var url = base_url+$('meta').attr('content').substr(8);
                request.get(url, {}, function(error, response, html) {
                    var $ = cheerio.load(html);
                    $('tr').each(function(index, value) {
                        if(index==0)return;
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
                                        /*new Person(person).save(function(error) {
                                            console.log(error);
                                        });
                                        */
                                    });
                                    break;
                                case 1:
                                    person.parents=$(value).text();
                                    break;
                            }
                        });
                    });
                });
            });
        });
    res.send("Started");
});

app.listen('8081');
exports = module.exports = app;

