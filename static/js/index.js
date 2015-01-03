$(document).ready(function() {
    $('#initiate').click(function() {
        var raw = $('#input_data').val();
        var persons = JSON.parse(raw);
        for(var person in persons) {
            $.post("/add_query", persons[person])
                .success(function() {
                })
                .fail(function() {
                });
        }
    });

    $('#search').click(function() {
        $.post('/init_search','')
            .success(function(){
            });
    });
});
