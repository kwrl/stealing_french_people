/*
 *  person = {
 *      last_name,
 *      first_name,
 *      year_of_birth
 *  }
 */


function interpret_line(line) {
    var items = line.split(" ");
    if(items.length!=3) {
        console.log("This line failed:\t", line)
        console.log(items);
        return null;
    }
    return {
        last_name : items[0],
        first_name : items[1],
        year_of_birth : items[2]
    };
}


$(document).ready(function() {
    $("#initiate").click(function(){
        console.log("CLICK!!");
        var lines = $("#input_data").val().split('\n');
        for(var line in lines) {
            var person = interpret_line(lines[line]);
            if(person!=null) {
                $.post("/search", person)
                    .success(function(){
                    }) 
                    .fail(function(){
                    });
                
            }
        }
    });
});
