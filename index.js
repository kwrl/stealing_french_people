var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var path = require('path');
var Sequelize = require('sequelize');

var BASE_URL = "http://genearmor.cotesdarmor.fr/moteur/";
var POST_URL = BASE_URL+'gapatience.php';

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

exports = module.exports = app;

var sequelize = new Sequelize('scraping_france', 'scraper', 'asd123ert', {
    dialect : "mysql",
    logging: false,
    port : 3306,
    host : "10.0.0.48"
});

sequelize
    .authenticate()
    .complete(function(err) {
        if (err) {
            console.log('Unable to connect to the database:', err)
        } else {
            console.log('Connection has been established successfully.')
        }
    });

var PersonQuery = sequelize.define('PersonQuery', {
    first_name : { type: Sequelize.STRING, allowNull : false },
    last_name : { type : Sequelize.STRING, allowNull : false },
    mother : Sequelize.STRING,
    father : Sequelize.STRING,
    year_of_birth : { type : Sequelize.INTEGER, allowNull : false }
}, {
    instanceMethods : {
        search : function() { 
            console.log("Performing query:\t" + this.first_name + " " + this.last_name);
            var query = this;
            var form = {
                TRONYME : "",
                PRENOM : this.first_name,
                PATRONYME: this.last_name,
                CONJOINT : "",
                B1 : "Rechercher",
                SOURCE : "0",
                TYPE : "T",
                TRI : "A"
            }; 
            request.post(POST_URL, {form : form},
                function(error, response, html) {
                    var $ = cheerio.load(html);
                    var url = BASE_URL+$("FRAME").attr('src');
                    query.step_one(url);
                }
            );
        },
        step_one :  function(url) {
            var query = this;
	        request.get(url, {encoding:null}, function(error, response, html) {
		        var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
		        var url = BASE_URL+$('meta').attr('content').substr(8);
                query.step_two(url);
	        });
        },
        step_two : function(url) {
            var query = this;
	        request.get(url, {encoding:null}, function(error, response, html) {
		    var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
		    var table = $("table:first-of-type");
		    table.find('tr:first-of-type').remove();
		    table.find('tr').each(function(index, value) {
			var person = {};
			$(value).children("td").each(function(index, value) {
				switch(index) {
					case 0:
						var url = BASE_URL+$(value).children("a").attr("href");
						person.fullname=$(value).text();
						request.get(url, {encoding:null} ,function(error, response, html) {
		                    var $ = cheerio.load(iconv.decode(new Buffer(html), 'ISO-8859-1'));
                            var raw_extra = $(".texte_std2").text().match(/[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]/);
                            if(raw_extra!=null && raw_extra.length>0){
                                person.year_of_death = raw_extra[0].substr(6,4);
                                person.month_of_death = raw_extra[0].substr(3,2);
                                person.day_of_death = raw_extra[0].substr(0,2);
                            }
							if(person.death!='' && person.fullname!='' && person.year_of_death!=0) {
								save_person_result(person, query);
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
    }
});

var PersonResult = sequelize.define('PersonResult', {
    fullname : { type : Sequelize.STRING, allowNull : false },
    parents : { type : Sequelize.STRING, allowNull : false },
    year_of_death : { 
        type : Sequelize.INTEGER,
        allowNull : false
    },
    month_of_death: { 
        type : Sequelize.INTEGER,
        allowNull : false
    },
    day_of_death: { 
        type : Sequelize.INTEGER,
        allowNull : false
    }
});

PersonQuery.hasMany(PersonResult);
PersonResult.belongsTo(PersonQuery);

sequelize
    .sync({force : true})
    .complete(function(err){
            if(err) {
                console.log("Synchronization failed");
            } else {
                console.log("Synchronization successful");
            }
    });

function save_person_result(person, query) {
    var p = PersonResult.build(person);
    p.setPersonQuery(query);
    p
        .save()
        .catch(function(err){
            console.log("Could not save person result.");
        });
}

function save_person_query(person) {
    PersonQuery.create(person)
        .complete(function(err){
            if(err) {
                console.log("Could not save person query.");
            } else {
                console.log("Saved a person query", person);
            }
        });
}

app.post('/add_query', function(req, res) {
    console.log("Received new query");
    save_person_query(req.body);
});

app.post('/init_search', function(req, res) {
    console.log("Starting search.");
    PersonQuery.findAll().on('success', function(queries) {
        queries.forEach(function(query) {   
            query.search();
        });
    });
});

app.get('/', function(reg, res) {
    res.render('home', {title : "Stealing french people"});
});

app.use("/static", express.static(path.join(__dirname,'static')));
app.listen('8081');

