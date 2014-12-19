var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var Sequelize = require('sequelize');
var sequelize = new Sequelize('scraping_france', 'scraper', 'password', {
    dialect : "mysql",
    port : 3306,
    host : "10.0.0.48"
});

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

sequelize
    .authenticate()
    .complete(function(err) {
        if (err) {
            console.log('Unable to connect to the database:', err)
        } else {
            console.log('Connection has been established successfully.')
        }
    });

var Person = sequelize.define('Person', {
    fullname : Sequelize.STRING,
    parents : Sequelize.STRING,
    extra : Sequelize.STRING
});

sequelize
    .sync({force : true})
    .complete(function(err){
            if(err) {
                console.log("Synchronization failed");
            } else {
                console.log("Synchronization successful");
            }
            Person.create({
                fullname : "Jesus Christ",
                parents : "Jahova",
                extra : "Never dies"
            }).complete(function(err, person) {
                if(err) {
                    console.log("Jesus failed");
                } else {
                    console.log("Jesus added.");
                }
            });
    });

function save_person(person) {
    Person.create(person)
        .complete(function(err){
            if(err) {
                console.log("Could not save person.");
            } else {
                console.log("Saved a person.");
            }
        });
}


app.get('/', function(req, res) {
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
                                            save_person(person);
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
            });
        });
    res.send("Started");
});

app.listen('8081');
exports = module.exports = app;

