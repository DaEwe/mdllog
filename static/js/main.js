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
var fb = new Firebase('https://fiery-heat-9174.firebaseio.com');
var fb_user;

var store = function(id, date, content){
  if (fb_user === undefined){
    //store only locally
  } else {
    
    fb_user.child("entries").child(id).set({"date": date, "content": content});
    fb_user.child("id").set(id);
  }
};

var fill_source = function(id){
  if (fb_user === undefined){
    //fetch locally
  } else {
   fb_user.child(id).once("value", function(snapshot){
      var entry = snapshot.val();
      $("#editor").focus().val(entry.content);
    });
  }
};


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
      } else {
        $(this).parent().parent().remove();
        id--;
      }
    $("#plusbutton").show();
  }
});


$(document).ready(function(){
  
  $("#conf-button").click(function(){
    $('#conf-modal').modal();
  });
  
  
  $("#online-backup-checkbox").click(function(){
    $("#online-backup-form-element").toggle(this.checked);
    console.log(this.checked);
  });
  
  $("#signupbutton").click(function(){
    fb.createUser({
      email    : $("#emailinput").val(),
      password : $("#passwordinput").val()
    }, function(error, userData) {
      if (error) {
        console.log("Error creating user:", error);
      } else {
        console.log("Successfully created user account with uid:", userData.uid);
      }
    });
    return false;
  });
  
  $("#loginbutton").click(function(){
    fb.authWithPassword({
      email    : $("#emailinput").val(),
      password : $("#passwordinput").val()
    }, function(error, authData) {
      if (error) {
        $("#errordisplay").show().children("div").text(error);
      } else {
        console.log("Authenticated successfully with payload:", authData);
        fb_user = new Firebase('https://fiery-heat-9174.firebaseio.com/users/'+ authData.uid);
        fb_user.child("id").on("value", function(snapshot){
          id = snapshot.val();
        });

        fb_user.child("entries").on('child_added', function(snapshot) {
          var entry = snapshot.val();
          if ($("#" + snapshot.key()).length === 0){
            var html = element_head 
            + entry_head 
            + date_head + entry.date + date_foot
            + marked(entry.content) 
            + entry_foot 
            + element_foot;
            
            $("#plusbutton").after(html).next().attr("id", snapshot.key());
          }
        });
         $('#conf-modal').modal("hide");
      }
    });
    return false;
  });
  
  
  $("#plusbutton").click(function(){
    $(this).after(element_head + editor_html + element_foot).next().attr("id", id++);
    $(this).hide();
    $("#editor").focus();
  });
  
  $("body").on("dblclick", ".entry", function(){
    $("#plusbutton").hide();
    var entry_id = $(this).parent().parent().attr("id");
    $(this).replaceWith(editor_html);
    fill_source(entry_id);
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
