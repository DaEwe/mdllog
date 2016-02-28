(function () {
   'use strict';


var editor_tmpl;
var element_tmpl;
var entry_tmpl;


var login_button = '<span class="glyphicon glyphicon-log-in" aria-hidden="true">';
var logout_button = '<span class="glyphicon glyphicon-log-out" aria-hidden="true">';

var fb;
var fb_user;

var guuid = function(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var store = function(id, date, content){
  if (fb_user === undefined){
    localStorage.setItem("id::" + id, JSON.stringify({"date": date, "content": content}));
  } else {
    fb_user.child("entries").child(id).set({"date": date, "content": content});
  }
};

var remove = function(id){
  if (fb_user === undefined){
    localStorage.removeItem("id::" + id);
  } else {
    fb_user.child("entries").child(id).remove();
  }
};

var fill_source = function(id){
  if (fb_user === undefined){
    var entry = JSON.parse(localStorage.getItem("id::" + id));
    $("#editor").focus().val(entry.content);
  } else {
   fb_user.child("entries").child(id).once("value", function(snapshot){
      var entry = snapshot.val();
      $("#editor").focus().val(entry.content);
    });
  }
};

var replace_with_entry = function(dom,id){
  if (fb_user === undefined){
    var entry = JSON.parse(localStorage.getItem("id::" + id));
    dom.replaceWith(Mustache.render(
      entry_tmpl,
      {date: entry.date.slice(0,10), content: marked(entry.content)}
    ));
  } else {
    fb_user.child("entries").child(id).once("value", function(snapshot){
      var entry = snapshot.val();
      dom.replaceWith(Mustache.render(
      entry_tmpl,
      {date: entry.date.slice(0,10), content: marked(entry.content)}
    ));
    });
  }
};

var add_entry = function(id, content, date){
  if ($("#" + id).length === 0){
    $("#plusbutton").after(Mustache.render(
      element_tmpl,
      {content: marked(content), date: date.slice(0,10), id: id},
      {inner: entry_tmpl}
    ));
    }
};

var initialize = function(authData){
  fb_user = new Firebase('https://fiery-heat-9174.firebaseio.com/users/'+ authData.uid);
  
  fb_user.child("entries").on('child_added', function(snapshot) {
    var entry = snapshot.val();
    add_entry(snapshot.key(), entry.content, entry.date);
  }); 
};


jQuery.fn.extend({
  markify: function(date, content){
    if (content === undefined){
      content = $(this).val();
    }
    if (date === undefined){
      date = new Date().toISOString();
    }
    var entry_id = $(this).parent().parent().attr("id");
    if ($.trim(content)!==""){
        $(this).replaceWith(Mustache.render(
          entry_tmpl,
          {date: date.slice(0,10),content: marked(content)}
        ));
        store(entry_id, date, content);
      } else {
        $(this).parent().parent().remove();
        remove(entry_id);
      }
    $("#plusbutton").show();
  }
});


$(document).ready(function(){
  editor_tmpl = $('#editor-template').html();
  element_tmpl = $('#element-template').html();
  entry_tmpl = $('#entry-template').html();
  Mustache.parse(editor_tmpl);
  Mustache.parse(element_tmpl);
  Mustache.parse(entry_tmpl);
  
  fb = new Firebase('https://fiery-heat-9174.firebaseio.com');
  fb.onAuth(function(authData){
    if (authData === null) {
      // configure button to open modal for login/signup
      $("#login-button").html(login_button).off( "click" ).click(function(){
        $('#conf-modal').modal();
        $("#errordisplay").hide();
      });
      

      for (var i = 0; i < localStorage.length; i++){
        var key = localStorage.key(i);
        if (key.startsWith("id::")){
          var entry = JSON.parse(localStorage.getItem(key));
          add_entry(key.slice(4), entry.content, entry.date);
        }
}
      
    } else {
      $("#login-button").html(logout_button).off( "click" ).click(function(){
        fb.unauth();
        $("#plusbutton").siblings().remove();
      });
      initialize(authData);
    }
  });
  
  $("#list-button").click(function(){
    $(".entry").each(function(){
      if ($(this).find(".teaser").length === 0){
        $(this).html("<h5 class='teaser'>" 
        + $(this).children(".date").text() 
        + ": " 
        + $(this).children(".content").children(':first-child').text().slice(0,20) 
        + "</h5>");
      }
    });
    return false;
  });
  
  $("body").on("click", ".teaser", function(){
    var teaser = $(this);
    var id = teaser.parents(".row").attr("id");
    replace_with_entry(teaser, id);
    
  });
  
  
  $("#signupbutton").click(function(){
    fb.createUser({
      email    : $("#emailinput").val(),
      password : $("#passwordinput").val()
    }, function(error, userData) {
      if (error) {
       $("#errordisplay").show().children("div").text(error);
      } else {
        $('#conf-modal').modal("hide");
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
        initialize(authData);
        $('#conf-modal').modal("hide");
      }
    });
    return false;
  });
  
  
  $("#plusbutton").click(function(){

    $(this).after(
      Mustache.render(element_tmpl,{id: guuid()},{inner: editor_tmpl})
    );
    $(this).hide();
    $("#editor").focus();
  });
  
  $("body").on("dblclick", ".entry", function(){
    $("#plusbutton").hide();
    var entry_id = $(this).parent().parent().attr("id");
    $(this).replaceWith(Mustache.render(editor_tmpl));
    fill_source(entry_id);
  });


  $("body").on('focusout','#editor', function(){
    $(this).markify();
  }); 
  
  $("body").on('change keyup paste',"#editor", function(e) {
    console.log("key");
    var content = $(this).val();
    if (e.keyCode == 27) {
      $(this).blur(); //triggers focusout
    } else if (content.endsWith("\n\n\n")){
      $(this).val(content.slice(0,-3));
      $(this).blur(); //triggers focusout
    }
});
 
});
}());