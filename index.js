var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var Sequelize = require('sequelize');
var sequelize = new Sequelize('scraping_france', 'scraper', 'asd123ert', {
    dialect : "mysql",
    port : 3306,
    host : "10.0.0.48"
});

var app = express();
var base_url = "http://genearmor.cotesdarmor.fr/moteur/";
var post_url = base_url+'gapatience.php';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
                            var raw_extra = $(".texte_std2").text().match(/[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]/);
                            if(raw_extra!=null && raw_extra.length>0){
							    person.death= raw_extra[0];
                            }
							if(person.death!='' && person.fullname!='') {
								console.log(person);
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
}

function getURL(url) {
	request.get(url, {}, function(error, response, html) {
		var $ = cheerio.load(html);
		var url = base_url+$('meta').attr('content').substr(8);
		getSecondURL(url);
	});
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
    death: Sequelize.STRING
});

sequelize
    .sync({force : true})
    .complete(function(err){
            if(err) {
                console.log("Synchronization failed");
            } else {
                console.log("Synchronization successful");
            }
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

app.post('/search', function(req, res) {
    console.log("Person received");
    var form = {
        TRONYME : "",
        PRENOM : req.body.first_name,
        PATRONYME: req.body.last_name,
        CONJOINT : "",
        B1 : "Rechercher",
        SOURCE : "0",
        TYPE : "T",
        TRI : "A"
    };
    console.log(form);
    request.post(post_url, {form : form},
        function(error, response, html) {
            var $ = cheerio.load(html);
            var url = base_url+$("FRAME").attr('src');
			getURL(url);
        });
    
    res.send("Started");
});

app.get('/', function(reg, res) {
    res.render('home', {title : "Skriv inn navn da.."});
});

app.use("/static", express.static(path.join(__dirname,'static')));


app.listen('8081');
exports = module.exports = app;









