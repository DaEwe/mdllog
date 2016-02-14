var editor_head = '<textarea id="editor" class="form-control" rows=8>';
var editor_foot = '</textarea>';
var editor_html = editor_head + editor_foot;
var element_head = '<div class="row"><div class="col-md-12">';
var element_foot = '</div></div>';
var date_head = '<div class="text-right date"><small>';
var date_foot = '</small></div>';
var entry_head = '<div class="entry">';
var entry_foot = '</div>';

var id = 0;
var entry_db = {};

function store(entry_id, date, content){
  localStorage.setItem(entry_id, JSON.stringify({"date": date, "content": content}));
  console.log("storing:" + localStorage.getItem(entry_id));
}

jQuery.fn.extend({
  markify: function(date, content){
    if (content === undefined){
      content = $(this).val();
    }
    if (date === undefined){
      date = new Date().toISOString().slice(0,10);
    }
    if ($.trim(content)!==""){
        var entry_id = parseInt($(this).parent().parent().attr("id"));
        var date_html = date_head + date + date_foot;
        $(this).replaceWith(entry_head + date_html + marked(content)  + entry_foot);
        store(entry_id, date, content);
        localStorage.setItem("id", id);
      } else {
        $(this).parent().parent().remove();
        id--;
      }
    $("#plusbutton").show();
  }
});


$(document).ready(function(){
  id = localStorage.getItem("id");
  $.each(localStorage, function(key, value){
    if (key != "id"){
      var entry = JSON.parse(value);
      // date_head + entry.date + date_foot+ marked(entry.content
      var html = element_head + entry_head + date_head + entry.date + date_foot+ marked(entry.content) + entry_foot + element_foot;
      $("#plusbutton").after(html).next().attr("id", key);
    }

});

  
  $("#plusbutton").click(function(){
    $(this).after(element_head + editor_html + element_foot).next().attr("id", id++);
    $(this).hide();
    $("#editor").focus();
  });
  
  $("body").on("dblclick", ".entry", function(){
    $("#plusbutton").hide();
    var entry_id = parseInt($(this).parent().parent().attr("id"));
    $(this).replaceWith(editor_html);
    var entry = JSON.parse(localStorage.getItem(entry_id));
    console.log(entry, entry.date);
    $("#editor").focus().val(entry.content);
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
