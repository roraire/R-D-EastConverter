/* Copyright (c) 2011 Fabien Cazenave, INRIA <http://wam.inrialpes.fr/>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * author      : Fabien Cazenave (:kaze)
 * contact     : fabien.cazenave@inria.fr, kaze@kompozer.net
 * license     : MIT
 * version     : 0.4.1
 * last change : 2011-03-30
 */

(function(){

/*****************************************************************************\
|                                                                             |
| This library adds 'navigation' support to timesheets.js.                    |
|                                                                             |
| As this is *NOT* part of the SMIL/Timing recommendation:                    |
|   * the microformat syntax is likely to change in upcoming versions         |
|   * this can be rather easily extended to support additional features       |
|                                                                             |
\*****************************************************************************/

function bindNavControls(timeContainer, navigation) {
  function hasControl(control) {
    var re = new RegExp("(^|[\\s;]+)" + control + "([\\s;]+|$)", "i");
    return re.test(navigation);
  }

  // get slideshow node
  var slideshow = timeContainer.target; // works fine with inline timing but...
  if (!slideshow) // ...sometimes the timeContainer is defined in a timesheet
    slideshow = timeContainer.timeNodes[0].target.parentNode;

  // keyboard events: http://unixpapa.com/js/key.html
  if (hasControl("arrows")) EVENTS.bind(document, "keydown", function(e) {
    var index = timeContainer.currentIndex;     // index of the current slide
    var count = timeContainer.timeNodes.length; // number of slides
    var slide = timeContainer.timeNodes[index]; // current slide
    switch(e.keyCode) {
      case 32: // spacebar => next/prev slide
        EVENTS.preventDefault(e);
        if (e.shiftKey)
          timeContainer.selectIndex(index - 1);
        else
          timeContainer.selectIndex(index + 1);
        break;
      case 33: // PageUp => previous slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(index - 1);
        break;
      case 34: // PageDown => next slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(index + 1);
        break;
      case 35: // end key => last slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(count - 1);
        break;
      case 36: // home key => first slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(0);
        break;
      case 37: // left arrow key => previous slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(index - 1);
        break;
      case 38: // up arrow key => restart current slide
        EVENTS.preventDefault(e);
        slide.reset();
        slide.show();
        break;
      case 39: // right arrow key => next slide
        EVENTS.preventDefault(e);
        timeContainer.selectIndex(index + 1);
        break;
      case 40: // down arrow key => click on current slide
        EVENTS.preventDefault(e);
        EVENTS.trigger(slide.target, "click");
        break;
      case 66: // B key => toogle buttons bar visible or not
	EVENTS.preventDefault(e);
	toogle_buttons_bar () ;
        break;
      case 70: // F key => All the slides Full Screen/Normal Screen
	EVENTS.preventDefault(e);
        toggle_slide_size () ;
        break;
      case 83: // S key => toogle session buttons visible or not
	EVENTS.preventDefault(e);
	toggle_session_buttons () ;
        break;
      default:
        break;
    }
  });

  // mouse clicks: http://unixpapa.com/js/mouse.html
  if (hasControl("click")) EVENTS.bind(slideshow, "mousedown", function(event) {
    // IE doesn't support event.which, relying on event.button instead
    var button = event.which || ([0,1,3,0,2])[event.button];
    if (button == 1)      // left click => next slide
      timeContainer.selectIndex(timeContainer.currentIndex + 1);
    else if (button == 2) // middle click => previous slide
      timeContainer.selectIndex(timeContainer.currentIndex - 1);
  });

  // mouse scroll: http://adomas.org/javascript-mouse-wheel/
  if (hasControl("scroll")) {
    function onMouseWheel(event) {
      if (event) {
        if (event.ctrlKey) return;
        event.preventDefault();
      }
      else {
        event = window.event;
        if (event.ctrlKey) return;
        event.returnValue = false;
      }
      // get scroll direction
      var delta = 0;
      if (event.wheelDelta) { // IE, Opera
        delta = event.wheelDelta / 120;
      } else if (event.detail) { // Mozilla
        delta = -event.detail / 3;
      }
      // prev/next slide
      if (delta < 0)
        timeContainer.selectIndex(timeContainer.currentIndex + 1);
      else if (delta > 0)
        timeContainer.selectIndex(timeContainer.currentIndex - 1);
    }
    if (window.addEventListener) // DOMMouseScroll is specific to Mozilla
      slideshow.addEventListener("DOMMouseScroll", onMouseWheel, false);
    slideshow.onmousewheel = onMouseWheel;
  }

  // update the hash whenever possible
  if (hasControl("hash")) {
    var timeNodes = timeContainer.timeNodes;
    for (var i = 0; i < timeNodes.length; i++) {
      var target = timeNodes[i].target;
      if (target.id) EVENTS.bind(target, "begin", function() {
        document.location.hash = "#" + this.id;
      });
    }
  }
}

EVENTS.onSMILReady(function() {
  // activate all navigation bindings
  var containers = document.getTimeContainersByTagName("*");
  for (var i = 0; i < containers.length; i++) {
    // parse the "navigation" attribute and get the target element
    // (works with "navigation", "data-navigation", "smil:navigation" and so on)
    var navigation = containers[i].parseAttribute("navigation");
    if (navigation) {
      bindNavControls(containers[i], navigation);
    }
  }
});

function toogle_buttons_bar () {
  
  var nav_par=document.getElementById("navigation_par");
  var ts_par=document.getElementById("text_size_par");
  
  var nav_par_style=nav_par.getAttribute("style");
  var ts_par_style=ts_par.getAttribute("style");
  
 
  if(nav_par_style) {
    
    if(nav_par_style == "display: none") {
      
      nav_par.setAttribute("style","display: block");
      
    }
    
    else {
      
      nav_par.setAttribute("style","display: none");
      
    }
    
  }
    
  else {
    
    nav_par.setAttribute("style","display: none");
    
  }
 
  if(ts_par_style) {
    
    if(ts_par_style == "display: none") {
      
      ts_par.setAttribute("style","display: block");
      
    }
    
    else {
      
      ts_par.setAttribute("style","display: none");
      
    }
    
  }
    
  else {
    
    ts_par.setAttribute("style","display: none");
    
  } 
}

function toggle_slide_size () {
  
  var liste_slides = document.getElementById("slideshow").getElementsByClassName("slide") ;
  var slide_style = liste_slides[0].getAttribute("style");
  
  if (slide_style)  {
    

    
    var i_width=slide_style.indexOf("width:100%");

    if (i_width >= "0" ) {
    

      slides_normal_size () ;
    }
  
    else {

      slides_full_screen ();
    
    }
    
  }
    
  else {
    
    slides_full_screen () ;
    
  }
  

  
  
}


function slides_full_screen () {
  
  var liste_slides = document.getElementById("slideshow").getElementsByClassName("slide") ;
  
  for (var i=0; i < liste_slides.length; i++) {
    
      var style_avant=liste_slides[i].getAttribute("style");

      if(style_avant) {

      		liste_slides[i].setAttribute("style",style_avant.concat("width:100%;height:100%;top:0%;left:0%;margin: 0px 0px 0px 0px;padding: 0px 0px 0px 0px;border-top-width: 0px;border-right-width: 0px;border-bottom-width: 0px;border-left-width: 0px;"));


      }

      else {
	      liste_slides[i].setAttribute("style","width:100%;height:100%;top:0%;left:0%;margin: 0px 0px 0px 0px;padding: 0px 0px 0px 0px;border-top-width: 0px;border-right-width: 0px;border-bottom-width: 0px;border-left-width: 0px;");

      }
           
  }
  
}

function slides_normal_size () {
  
  var liste_slides = document.getElementById("slideshow").getElementsByClassName("slide") ;
  
  for (var i=0; i < liste_slides.length; i++) {
    

	var style=liste_slides[i].getAttribute("style");

	var style_reg=new RegExp("width.*$","");
	var style_new = style.replace(style_reg,"");

	liste_slides[i].setAttribute("style",style_new);
    
  }
  
}

function toggle_session_buttons () {
  
 var rec_button=document.getElementById("session_rec");
 var export_button=document.getElementById("session_export");
 var import_button=document.getElementById("session_import");
 
 
  
  var rec_button_style=rec_button.getAttribute("style");
  var export_button_style=export_button.getAttribute("style");
  var import_button_style=import_button.getAttribute("style");
 
  
 
  if(rec_button_style) {
    
    if(rec_button_style == "display: none") {
      
      rec_button.setAttribute("style","display: inline");
      export_button.setAttribute("style","display: inline");
      import_button.setAttribute("style","display: inline");
      
    }
    
    else {
      
      rec_button.setAttribute("style","display: none");
      export_button.setAttribute("style","display: none");
      import_button.setAttribute("style","display: none");
      
    }
    
  }
    
  else {
    
    rec_button.setAttribute("style","display: inline");
    export_button.setAttribute("style","display: inline");
    import_button.setAttribute("style","display: inline")
    
  }
 

}



})


();
