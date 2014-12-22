/*
 *  person = {
 *      last_name,
 *      first_name,
 *      year_of_birth
 *  }
 */


function interpret_line(line) {
    var items = line.split(" ");
    var names = "";
    for(var i=2;i<items.length;i++) {
        names+=items[i]+' ';
    }
    return {
        year_of_birth : items[0],
        last_name : items[1],
        first_name : names,
    };
}


$(document).ready(function() {
    $("#initiate").click(function() {
        var lines = $("#input_data").val().split('\n');
        for(var line in lines) {
            (function(i) {
                setTimeout(function() {
                    var person = interpret_line(lines[i]);
                    console.log("First name:\t",person.first_name);
                    console.log("Last name:\t",person.last_name);
                    console.log("Year of birth:\t",person.year_of_birth);
                    if(person!=null) {
                        $.post("/search", person)
                        .success(function(){
                        }) 
                        .fail(function(){
                        });
                    }
                }, 1000*i);
            }(line));
        }
    });
});
