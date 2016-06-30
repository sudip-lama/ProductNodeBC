$(document).ready(function(){


  $(document).ajaxStart(function(){
        $("#wait").css("display", "block");
    });
    $(document).ajaxComplete(function(){
        $("#wait").css("display", "none");
    });

    $('.nav-tabs a').click(function(){
        $(this).tab('show');
    });
    $('.nav-tabs a[href="#offering"]').on('shown.bs.tab', function(event){

       // Empty content string
       var tableContent = '';
       $.getJSON( '/getOfferings', function( data ) {

          $("div#spinner").show();
        // For each item in our JSON, add a table row and cells to the content stringOFFERING_ID
        $.each(data, function(){
            tableContent += '<li class="list-group-item text-right"><a href="/getOfferings/'+ this.OFFERING_ID+'" class="pull-left" ';
            tableContent +='title="'+this.OFFERING_DESCRIPTION+'" >';
            tableContent += this.OFFERING_CATEGORY + '</a>$ ' + this.CURRENT_LIST_PRICE + '</li>';
        });
        $("div#spinner").hide();
        // Inject the whole content string into our existing HTML table
        $('#offeringList').html(tableContent);
    });
   });

});
