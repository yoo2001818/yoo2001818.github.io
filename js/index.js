var menuObj;
var menuPosY;
var menuHeight;
var menuFixed = false;
var staticMenuListObj;
var menuBottomObj;
var menuListObj;
var menuListSelected;
var menuListArray;
var contentObj;
var footerObj;
var bottomY;
var mdRenderer = new marked.Renderer();

mdRenderer.heading = function(text, level) {
  var escapedText = text.toLowerCase().replace(/[^a-z가-힣]+/g, '-');
  return '<h' + level + ' class="heading">' +
    '<a name="' +
    escapedText + 
    '" class="anchor-key"></a>' +
    text +
    '<a class="anchor" href="#' +
    escapedText +
    '"><span class="fa fa-link"></span></a></h' + level + '>';
}

window.onload = function () {
  'use strict';
  var lang = 'en';
  var browserLang = navigator.language || navigator.userLanguage;
  if(browserLang == 'ko-KR') {
    //lang = 'ko';
  }
  
  contentObj = document.getElementById('content');
  
  var req = new XMLHttpRequest();
  req.onload = function() {
    var html_content = contentObj;
    var md_content = this.responseText;
    html_content.innerHTML = marked(md_content, {renderer: mdRenderer});
    setTimeout(function() {
      drawMenu();
      updateMenuSize();
      // Scroll to anchor
      var hash =  window.location.hash;
      window.location.hash = "";
      window.location.hash = hash;
    }, 100);
  }
  req.open('get', './md/'+lang+'.md');
  req.overrideMimeType('text/plain');
  req.send();
  
  menuListObj = document.getElementById('menuList');
  staticMenuListObj = document.getElementById('menuListStatic');
  menuBottomObj = document.getElementById('menuBottom');
  
  menuObj = document.getElementById('navigation');
  
  footerObj = document.getElementById('footer');
  
  updateMenuSize();
};

window.onresize = function() {
  setTimeout(updateMenuSize, 50);
}

function updateMenuSize() {
  var scrollY = window.pageYOffset || document.documentElement.scrollTop;
  var menuRect = menuObj.getBoundingClientRect();
  menuHeight = menuRect.height;
  var menuBottomRect = menuBottomObj.getBoundingClientRect();
  menuPosY = menuBottomRect.top + scrollY;
  var contentRect = contentObj.getBoundingClientRect();
  bottomY = contentRect.bottom + scrollY;
  var footerRect = footerObj.getBoundingClientRect();
  var footerH = footerRect.height;
  if(window.innerHeight > (bottomY + footerH)) {
    footerObj.style.position = "fixed";
    footerObj.style.bottom = "0";
    footerObj.style.left = "0";
    footerObj.style.right = "0";
  } else {
    footerObj.style.position = "static";
  }
}

function drawMenu() {
  var scrollY = window.pageYOffset || document.documentElement.scrollTop;
  var headers = contentObj.querySelectorAll('h1');
  // I think escaping is not necessary..
  // Urrugh this doesn't support .reduce and stuff
  
  // Delete all nodes before adding menu
  while(menuListObj.firstChild) {
    menuListObj.removeChild(menuListObj.firstChild);
  }
  while(staticMenuListObj.firstChild) {
    staticMenuListObj.removeChild(staticMenuListObj.firstChild);
  }
  menuListArray = [];
  for(var i = 0; i < headers.length; ++i) {
    var text = headers[i].childNodes[1].wholeText;
    var anchorObj = headers[i].childNodes[0];
    var anchor = anchorObj.name;
    
    var listHtml = 
      '<a class="menu-entry anchor" href="#' +
      anchor +
      '">' +
      text +
      '</a>';
    
    var node = document.createElement('li');
    node.innerHTML = listHtml;
    
    menuListArray.push({
      y: anchorObj.getBoundingClientRect().top + scrollY,
      node: node
    });
    
    menuListObj.appendChild(node);
    
    var staticNode = document.createElement('li');
    staticNode.innerHTML = listHtml;
    staticMenuListObj.appendChild(staticNode);
  }
}

window.onscroll = function() {
  var scrollY = window.pageYOffset || document.documentElement.scrollTop;
  if(scrollY >= menuPosY) {
    if(!menuFixed) {
      menuObj.style.position = "fixed";
      menuObj.style.top = "0";
      menuObj.style.left = "0";
      menuObj.style.right = "0";
      contentObj.style.paddingTop = menuHeight+"px";
      menuFixed = true;
    }
  } else {
    if(menuFixed) {
      menuFixed = false;
      menuObj.style.position = "static";
      contentObj.style.paddingTop = "0px";
    }
  }
  var selectedNode = menuListArray[menuListArray.length - 1].node;
  for(var i = menuListArray.length - 2; i >= 0; --i) {
    if(scrollY < menuListArray[i+1].y-4) {
      selectedNode = menuListArray[i].node;
    }
  }
  if(scrollY < menuListArray[0].y-4) {
    selectedNode = null;
  }
  if(menuListSelected) {
    menuListSelected.className = "";
  }
  if(selectedNode) {
    selectedNode.className = "menu-selected";
    menuListSelected = selectedNode;
  }
}
