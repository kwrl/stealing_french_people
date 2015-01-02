$(document).ready(function() {
    $('#initiate').click(function() {
        var raw = $('#input_data').val();
        var persons = JSON.parse(raw);
        for(var person in persons) {
            (function(i) {
                setTimeout(function() {
                $.post("/add_query", persons[person])
                    .success(function() {
                    })
                    .fail(function() {
                    });
                }, 100*i);
            })(person);
        }
    });
    $('#search').click(function() {
        $.post('/init_search','')
            .success(function(){
            });
    });
});
