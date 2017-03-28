// pour jslint
var EVENTS = EVENTS || {};
var console = console || {};
var unescape = unescape || {};

(function(){

// public API
document.SESSION = {};

// session events list
var sessionEvents = [];
// absolute time of last event
var sessionLastEventTime = (new Date()).getTime();
// are we recording or playing a session ?
var sessionIsRecording = true;
// 
var slideControlContainer = null;
// counter for elsommaire2 elements
var id_cpt = 100;

// adds an event to the session events list
var pushEvent = function(event, id){
  var eventTime = (new Date()).getTime();
  var interval = eventTime - sessionLastEventTime;
  sessionLastEventTime = eventTime;

  // do not catch show or reset event happening after slide event
  if (sessionEvents[sessionEvents.length-1].type !== 'slide' ||
      (event !== 'show' && event !== 'reset')) {
    sessionEvents.push({
      type: event,
      id: id,
      time: interval
    });
  }
};

// === Events functions
var new_selectIndex = function(){
  // arguments[0] is the index number
  if (sessionIsRecording){
    pushEvent('slide', arguments[0]);
  }
  return this.org_selectIndex.apply(this, arguments);
};
var new_slide_reset = function(){
  if (sessionIsRecording){
    pushEvent('reset');
  }
  return this.org_reset.apply(this, arguments);
};
var new_slide_show = function(){
  if (sessionIsRecording){
    pushEvent('show');
  }
  return this.org_show.apply(this, arguments);
};
var new_slide_click = function(e){
  if (sessionIsRecording){
    pushEvent('click');
  }
};
var new_li_click = function(id, e){
  if (sessionIsRecording){
    pushEvent('li', id);
  }
};
// ===

// Adds an id to title elements if necessary
var checkID = function(node){
  if (!node.hasAttribute('id')) {
    node.id = 'el'+(id_cpt++);
  }
  return node.id;
};

// Converts session events array to XML
var sessionEventsToXml = function(){
  var doc = document.implementation.createDocument("", "", null);
  doc.appendChild(doc.createComment("SMIL session file"));
  doc.appendChild(doc.createComment("Open your presentation, click \"Load session\" button and select this file."));
  doc.appendChild(doc.createElement('xml'));
  doc.lastChild.appendChild(doc.createTextNode('\n'));
  for (var _e=0; _e<sessionEvents.length; _e+=1) {
    var e = doc.createElement('event');
    e.setAttribute('type', sessionEvents[_e].type);
    e.setAttribute('id', sessionEvents[_e].id);
    e.setAttribute('time', sessionEvents[_e].time);
    doc.lastChild.appendChild(e);
    doc.lastChild.appendChild(doc.createTextNode('\n'));
  }
  return (new XMLSerializer()).serializeToString(doc);
};

var xmlToSessionEvents = function(xml){
  var doc = (new DOMParser()).parseFromString(xml, "application/xml");
  var events = doc.getElementsByTagName('event');
  var session = [];
  for (var _e=0; _e<events.length; _e+=1) {
    session.push({
      type: events[_e].getAttribute('type'),
      id: events[_e].getAttribute('id'),
      time: events[_e].getAttribute('time')
    });
  }
  return session;
};

var playSession = function(){
  var position = 0;
  var lastTimeout;

  var walkSession = function(){
    switch (sessionEvents[position].type){
      case 'slide':
        slideControlContainer.selectIndex(parseInt(sessionEvents[position].id, 10));
        break;
      case 'reset':
        document.getTimeContainersByTarget(document.getElementById(window.location.hash.slice(1)))[0].reset();
        break;
      case 'show':
        document.getTimeContainersByTarget(document.getElementById(window.location.hash.slice(1)))[0].show();
        break;
      case 'click':
        document.getElementById(window.location.hash.slice(1)).click();
        break;
      case 'li':
        document.getElementById(sessionEvents[position].id).click();
        break;
    }
    position += 1;
    if (position < sessionEvents.length){
      lastTimeout = window.setTimeout(walkSession, sessionEvents[position].time);
    }
  };

  sessionIsRecording = false;
  walkSession();
};

document.SESSION.record = function(){
  sessionEvents = [{
    type: 'slide',
    id: slideControlContainer.currentIndex,
    time: 0
  }];
  sessionLastEventTime = (new Date()).getTime();
  sessionIsRecording = true;
};

EVENTS.onSMILReady(function() {
  var containers = document.getTimeContainersByTagName("*");
  slideControlContainer = containers[containers.length-1];
  for (var _i=0; _i<containers.length; _i+=1) {
    var navigation = containers[_i].parseAttribute("navigation");
    if (navigation) {
      // overrides selectIndex for each slide
      containers[_i].org_selectIndex = containers[_i].selectIndex;
      containers[_i].selectIndex = new_selectIndex;

      for (var _j=0; _j<containers[_i].timeNodes.length; _j+=1) {
        var slide = containers[_i].timeNodes[_j];
        // overrides slide.reset()
        slide.org_reset = slide.reset;
        slide.reset = new_slide_reset;
        // overrides slide.show()
        slide.org_show = slide.show;
        slide.show = new_slide_show;
        // intercepts slide click
        EVENTS.bind(slide.target, "click", new_slide_click);
      }
    }
  }
  // intercepts click on list
  var liTab = document.getElementsByTagName("li");
  for (_i=0; _i<liTab.length; _i+=1) {
    if (liTab[_i].hasAttribute("smil")){
      liTab[_i].addEventListener("click", new_li_click.bind(null, checkID(liTab[_i])));
    }
  }

  // add buttons in navbar
  var recbtn = document.createElement('button');
  var exportbtn = document.createElement('button');
  var fileInput = document.createElement('input');
  recbtn.setAttribute('id', 'session_rec');
  recbtn.title = 'Start session recording';
  recbtn.appendChild(document.createTextNode('Record session'));
  exportbtn.id = 'session_export'; exportbtn.title = 'Export session';
  exportbtn.appendChild(document.createTextNode('Export session'));
  fileInput.type = 'file'; fileInput.id = 'session_import'; fileInput.title = 'Import session';

  recbtn.addEventListener('click', document.SESSION.record);
  
  exportbtn.addEventListener('click', function(){
    window.open('data:text/xml;base64,' +
                    window.btoa(unescape(
                      encodeURIComponent(sessionEventsToXml())
                    )));
  });

  fileInput.addEventListener('change', function(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(f){
      sessionEvents = xmlToSessionEvents(f.target.result);
      playSession();
    };
    reader.readAsText(file);
  });

  document.getElementById('navigation_par').appendChild(recbtn);
  document.getElementById('navigation_par').appendChild(exportbtn);
  document.getElementById('navigation_par').appendChild(fileInput);

  document.SESSION.record();
});

})();
