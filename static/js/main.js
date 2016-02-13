var editor_head = "<textarea id='editor' class='form-control' rows=8>";
var editor_foot = "</textarea>";
var editor_html = editor_head + editor_foot;
var element_head = "<div class='row'><div class='col-md-12'>";
var element_foot = "</div></div>";
var id = 0;
var entry_db = {};


jQuery.fn.extend({
  markify: function(){
    var content = $(this).val();
    if ($.trim(content)!==""){
        var entry_id = parseInt($(this).parent().parent().attr("id"));
        console.log("adding " + entry_id + ": " + content);
        entry_db[entry_id]=content;
        $(this).replaceWith("<div class='entry'>" +  marked(content)  + "</div>");
      } else {
        $(this).parent().parent().remove();
      }
    $("#plusbutton").show();
  }
});


$(document).ready(function(){
  
  $(".entry").each(function(){
    $(this).html(marked($(this).text()));
  });
  
  $("#plusbutton").click(function(){
    $(this).after(element_head + editor_html + element_foot).next().attr("id", id++);
    $(this).hide();
    $("#editor").focus();
  });
  
  $("body").on("click", ".entry", function(){
    $("#plusbutton").hide();
    var entry_id = parseInt($(this).parent().parent().attr("id"));
    $(this).replaceWith(editor_html);
    $("#editor").focus().val(entry_db[entry_id]);
  });


  $("body").on('focusout','#editor', function(){
    $(this).markify();
  }); 
  
  $("body").on('change keyup paste',"#editor", function(e) {
    var content = $(this).val();
    if (e.keyCode == 27) {
      $(this).blur(); //triggers focusout
    } else if (content.endsWith("\n\n\n")){
      $(this).val(content.slice(0,-3));
      $(this).blur(); //triggers focusout
    }
});
 
});
